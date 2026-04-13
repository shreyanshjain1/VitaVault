import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { hasRedisConfig, shouldSkipRedisDuringBuild } from "@/lib/jobs/connection";
import {
  enqueueAlertEvaluationJob,
  enqueueDailyHealthSummaryJob,
  enqueueDeviceSyncProcessingJob,
  enqueueReminderGenerationJob,
  enqueueReminderOverdueEvaluationJob,
} from "@/lib/jobs/enqueue";

type DispatchBody =
  | {
      jobType: "alert-evaluation";
      userId?: string;
      sourceType?:
        | "VITAL_RECORD"
        | "MEDICATION_LOG"
        | "SYMPTOM_ENTRY"
        | "SYNC_JOB"
        | "DEVICE_READING"
        | "SCHEDULED_SCAN"
        | null;
      sourceId?: string | null;
      sourceRecordedAt?: string | null;
      initiatedBy?: "record_create" | "scheduled_scan" | "manual_scan" | "sync_finish";
    }
  | {
      jobType: "reminder-generation";
      userId?: string;
      timezone?: string | null;
      targetDate?: string | null;
    }
  | {
      jobType: "reminder-overdue-evaluation";
      userId?: string;
      timezone?: string | null;
    }
  | {
      jobType: "daily-health-summary";
      userId?: string;
      targetDate?: string | null;
    }
  | {
      jobType: "device-sync-processing";
      userId?: string;
      connectionId?: string | null;
      syncJobId?: string | null;
    };

export async function POST(request: Request) {
  try {
    if (!hasRedisConfig()) {
      return NextResponse.json(
        { error: "Background jobs are unavailable because REDIS_URL is not configured." },
        { status: 503 }
      );
    }

    if (shouldSkipRedisDuringBuild()) {
      return NextResponse.json(
        { error: "Background jobs are unavailable during build-time execution." },
        { status: 503 }
      );
    }

    const currentUser = await requireUser();
    const body = (await request.json()) as DispatchBody;

    const userId = body.userId || currentUser.id!;
    if (!userId) {
      return NextResponse.json({ error: "Missing user id." }, { status: 400 });
    }

    switch (body.jobType) {
      case "alert-evaluation": {
        const result = await enqueueAlertEvaluationJob({
          userId,
          sourceType: body.sourceType ?? null,
          sourceId: body.sourceId ?? null,
          sourceRecordedAt: body.sourceRecordedAt ?? null,
          initiatedBy: body.initiatedBy ?? "manual_scan",
        });

        return NextResponse.json({ ok: true, jobType: body.jobType, ...result });
      }

      case "reminder-generation": {
        const result = await enqueueReminderGenerationJob({
          userId,
          timezone: body.timezone ?? null,
          targetDate: body.targetDate ?? null,
          requestedByUserId: currentUser.id!,
        });

        return NextResponse.json({ ok: true, jobType: body.jobType, ...result });
      }

      case "reminder-overdue-evaluation": {
        const result = await enqueueReminderOverdueEvaluationJob({
          userId,
          timezone: body.timezone ?? null,
          requestedByUserId: currentUser.id!,
        });

        return NextResponse.json({ ok: true, jobType: body.jobType, ...result });
      }

      case "daily-health-summary": {
        const result = await enqueueDailyHealthSummaryJob({
          userId,
          targetDate: body.targetDate ?? null,
          requestedByUserId: currentUser.id!,
        });

        return NextResponse.json({ ok: true, jobType: body.jobType, ...result });
      }

      case "device-sync-processing": {
        const result = await enqueueDeviceSyncProcessingJob({
          userId,
          connectionId: body.connectionId ?? null,
          syncJobId: body.syncJobId ?? null,
          triggeredBy: currentUser.id!,
        });

        return NextResponse.json({ ok: true, jobType: body.jobType, ...result });
      }

      default:
        return NextResponse.json({ error: "Unsupported job type." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to dispatch job.",
      },
      { status: 500 }
    );
  }
}
