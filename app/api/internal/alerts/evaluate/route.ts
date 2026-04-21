import { NextResponse } from "next/server";
import { z } from "zod";
import { enqueueAlertEvaluation } from "@/lib/jobs/enqueue";
import {
  authenticateInternalRequest,
  canEvaluateAlertsForUser,
} from "@/lib/internal-api-auth";

const evaluateBodySchema = z.object({
  userId: z.string().trim().min(1, "userId is required."),
  sourceType: z
    .enum([
      "VITAL_RECORD",
      "MEDICATION_LOG",
      "SYMPTOM_ENTRY",
      "SYNC_JOB",
      "DEVICE_READING",
      "SCHEDULED_SCAN",
    ])
    .nullable()
    .optional(),
  sourceId: z.string().trim().min(1).nullable().optional(),
  sourceRecordedAt: z.string().trim().min(1).nullable().optional(),
  initiatedBy: z
    .enum(["record_create", "scheduled_scan", "manual_scan", "sync_finish"])
    .optional(),
});

export async function POST(request: Request) {
  const actor = await authenticateInternalRequest(request);

  if (!actor.ok) {
    return NextResponse.json(
      { error: "Unauthorized internal request." },
      { status: 401 }
    );
  }

  const parsed = evaluateBodySchema.safeParse(
    await request.json().catch(() => ({}))
  );

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid request body.",
      },
      { status: 400 }
    );
  }

  const body = parsed.data;

  if (
    actor.kind === "session" &&
    !canEvaluateAlertsForUser({
      actorId: actor.user.id,
      actorRole: actor.user.role,
      targetUserId: body.userId,
    })
  ) {
    return NextResponse.json(
      { error: "Forbidden for the requested user." },
      { status: 403 }
    );
  }

  const result = await enqueueAlertEvaluation({
    userId: body.userId,
    sourceType: body.sourceType ?? null,
    sourceId: body.sourceId ?? null,
    sourceRecordedAt: body.sourceRecordedAt ?? null,
    initiatedBy: body.initiatedBy ?? "manual_scan",
  });

  return NextResponse.json({ ok: true, ...result });
}
