import { AlertSourceType, JobKind } from "@prisma/client";

export const QUEUE_NAMES = {
  alerts: "alerts",
  reminders: "reminders",
  dailySummary: "daily-summary",
  deviceSync: "device-sync",
} as const;

export const JOB_NAMES = {
  alertEvaluation: "alert-evaluation",
  alertScheduledScan: "alert-scheduled-scan",
  reminderGeneration: "reminder-generation",
  dailyHealthSummary: "daily-health-summary",
  deviceSyncProcessing: "device-sync-processing",
} as const;

export type AlertEvaluationJobPayload = {
  userId: string;
  sourceType?: AlertSourceType | null;
  sourceId?: string | null;
  sourceRecordedAt?: string | null;
  initiatedBy?: "record_create" | "scheduled_scan" | "manual_scan" | "sync_finish";
};

export type AlertEvaluationJobData = AlertEvaluationJobPayload;
export type AlertEvaluationJobResult = {
  evaluatedRuleCount: number;
  createdAlertCount: number;
  createdAlertIds: string[];
};

export type ReminderGenerationJobData = {
  userId: string;
};

export type ReminderGenerationJobResult = {
  ok: boolean;
};

export type DailyHealthSummaryJobData = {
  userId: string;
};

export type DailyHealthSummaryJobResult = {
  ok: boolean;
};

export type DeviceSyncProcessingJobData = {
  userId: string;
  connectionId?: string | null;
  syncJobId?: string | null;
};

export type DeviceSyncProcessingJobResult = {
  ok: boolean;
};

export function getJobKindByName(jobName: string): JobKind {
  switch (jobName) {
    case JOB_NAMES.alertEvaluation:
    case JOB_NAMES.alertScheduledScan:
      return "ALERT_EVALUATION";
    case JOB_NAMES.reminderGeneration:
      return "REMINDER_GENERATION";
    case JOB_NAMES.dailyHealthSummary:
      return "DAILY_HEALTH_SUMMARY";
    case JOB_NAMES.deviceSyncProcessing:
      return "DEVICE_SYNC_PROCESSING";
    default:
      return "ALERT_EVALUATION";
  }
}