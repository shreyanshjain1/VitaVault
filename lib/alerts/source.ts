import { AlertSourceType } from "@prisma/client";
import { enqueueAlertEvaluation } from "@/lib/jobs/enqueue";

export async function enqueueThresholdAlertEvaluation(args: {
  userId: string;
  sourceType?: AlertSourceType | null;
  sourceId?: string | null;
  sourceRecordedAt?: Date | null;
  initiatedBy?: "record_create" | "scheduled_scan" | "manual_scan" | "sync_finish";
}) {
  await enqueueAlertEvaluation({
    userId: args.userId,
    sourceType: args.sourceType ?? null,
    sourceId: args.sourceId ?? null,
    sourceRecordedAt: args.sourceRecordedAt?.toISOString() ?? null,
    initiatedBy: args.initiatedBy ?? "record_create",
  });
}
