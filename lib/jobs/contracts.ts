import { AlertSourceType, JobKind } from "@prisma/client";

export const QUEUE_NAMES = {
  alerts: "alerts",
} as const;

export const JOB_NAMES = {
  alertEvaluation: "alert-evaluation",
  alertScheduledScan: "alert-scheduled-scan",
} as const;

export type AlertEvaluationJobPayload = {
  userId: string;
  sourceType?: AlertSourceType | null;
  sourceId?: string | null;
  sourceRecordedAt?: string | null;
  initiatedBy?: "record_create" | "scheduled_scan" | "manual_scan" | "sync_finish";
};

export function getJobKindByName(jobName: string): JobKind {
  switch (jobName) {
    case JOB_NAMES.alertEvaluation:
    case JOB_NAMES.alertScheduledScan:
      return "ALERT_EVALUATION";
    default:
      return "ALERT_EVALUATION";
  }
}
