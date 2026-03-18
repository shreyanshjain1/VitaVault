import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { APP_ROLES, SYNC_JOB_STATUS } from "@/lib/domain/enums";
import {
  enqueueAlertEvaluationJob,
  enqueueDailyHealthSummaryJob,
  enqueueDeviceSyncProcessingJob,
  enqueueReminderGenerationJob,
} from "@/lib/jobs/enqueue";

const dispatchSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("ALERT_EVALUATION"),
    userId: z.string().optional(),
    source: z.enum(["manual", "schedule", "sync-hook"]).optional(),
  }),
  z.object({
    kind: z.literal("REMINDER_GENERATION"),
    userId: z.string().optional(),
    horizonDays: z.number().int().min(1).max(30).optional(),
  }),
  z.object({
    kind: z.literal("DAILY_HEALTH_SUMMARY"),
    userId: z.string().optional(),
    targetDate: z.string().datetime().optional(),
  }),
  z.object({
    kind: z.literal("DEVICE_SYNC_PROCESSING"),
    connectionId: z.string().min(1),
  }),
]);

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = dispatchSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid job payload.",
      },
      { status: 400 }
    );
  }

  const isAdmin = session.user.role === APP_ROLES.ADMIN;
  const currentUserId = session.user.id;

  try {
    switch (parsed.data.kind) {
      case "ALERT_EVALUATION": {
        const targetUserId =
          isAdmin && parsed.data.userId ? parsed.data.userId : currentUserId;

        const result = await enqueueAlertEvaluationJob({
          userId: targetUserId,
          requestedByUserId: currentUserId,
          source: parsed.data.source ?? "manual",
        });

        return NextResponse.json({ ok: true, ...result });
      }

      case "REMINDER_GENERATION": {
        const targetUserId =
          isAdmin && parsed.data.userId ? parsed.data.userId : currentUserId;

        const result = await enqueueReminderGenerationJob({
          userId: targetUserId,
          requestedByUserId: currentUserId,
          horizonDays: parsed.data.horizonDays ?? 7,
        });

        return NextResponse.json({ ok: true, ...result });
      }

      case "DAILY_HEALTH_SUMMARY": {
        const targetUserId =
          isAdmin && parsed.data.userId ? parsed.data.userId : currentUserId;

        const result = await enqueueDailyHealthSummaryJob({
          userId: targetUserId,
          requestedByUserId: currentUserId,
          targetDate: parsed.data.targetDate,
        });

        return NextResponse.json({ ok: true, ...result });
      }

      case "DEVICE_SYNC_PROCESSING": {
        const connection = await db.deviceConnection.findFirst({
          where: isAdmin
            ? { id: parsed.data.connectionId }
            : { id: parsed.data.connectionId, userId: currentUserId },
        });

        if (!connection) {
          return NextResponse.json(
            { error: "Device connection not found." },
            { status: 404 }
          );
        }

        const syncJob = await db.syncJob.create({
          data: {
            userId: connection.userId,
            connectionId: connection.id,
            source: connection.source,
            platform: connection.platform,
            status: SYNC_JOB_STATUS.QUEUED,
            metadataJson: JSON.stringify({
              requestedByUserId: currentUserId,
              origin: "jobs-dashboard",
            }),
          },
        });

        const result = await enqueueDeviceSyncProcessingJob({
          userId: connection.userId,
          connectionId: connection.id,
          syncJobId: syncJob.id,
          requestedByUserId: currentUserId,
          triggeredBy: "manual",
        });

        return NextResponse.json({ ok: true, syncJobId: syncJob.id, ...result });
      }

      default:
        return NextResponse.json(
          { error: "Unsupported job kind." },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to dispatch job.",
      },
      { status: 500 }
    );
  }
}