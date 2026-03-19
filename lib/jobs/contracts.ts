import { JobKind } from "@prisma/client";

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
  reminderOverdueEvaluation: "reminder-overdue-evaluation",
  dailyHealthSummary: "daily-health-summary",
  deviceSyncProcessing: "device-sync-processing",
} as const;

export type AlertEvaluationJobPayload = {
  userId: string;
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
};

export type AlertEvaluationJobData = AlertEvaluationJobPayload;
export type AlertEvaluationJobResult = {
  evaluatedRuleCount: number;
  createdAlertCount: number;
  createdAlertIds: string[];
};

export type ReminderGenerationJobData = {
  userId: string;
  timezone?: string | null;
  targetDate?: string | null;
  requestedByUserId?: string | null;
};

export type ReminderGenerationJobResult = {
  ok: boolean;
  created: number;
  deduped: number;
};

export type ReminderOverdueEvaluationJobData = {
  userId: string;
  timezone?: string | null;
  requestedByUserId?: string | null;
};

export type ReminderOverdueEvaluationJobResult = {
  ok: boolean;
  overdueMarked: number;
  missedMarked: number;
};

export type DailyHealthSummaryJobData = {
  userId: string;
  targetDate?: string | null;
  requestedByUserId?: string | null;
};

export type DailyHealthSummaryJobResult = {
  ok: boolean;
};

export type DeviceSyncProcessingJobData = {
  userId: string;
  connectionId?: string | null;
  syncJobId?: string | null;
  triggeredBy?: string | null;
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
    case JOB_NAMES.reminderOverdueEvaluation:
      return "REMINDER_GENERATION";
    case JOB_NAMES.dailyHealthSummary:
      return "DAILY_HEALTH_SUMMARY";
    case JOB_NAMES.deviceSyncProcessing:
      return "DEVICE_SYNC_PROCESSING";
    default:
      return "ALERT_EVALUATION";
  }
}