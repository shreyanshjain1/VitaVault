import { JOB_KIND, type JobKindValue } from "@/lib/domain/enums";

export const JOB_QUEUE_NAMES: Record<JobKindValue, string> = {
  [JOB_KIND.ALERT_EVALUATION]: "vitavault_alert_evaluation",
  [JOB_KIND.REMINDER_GENERATION]: "vitavault_reminder_generation",
  [JOB_KIND.DAILY_HEALTH_SUMMARY]: "vitavault_daily_health_summary",
  [JOB_KIND.DEVICE_SYNC_PROCESSING]: "vitavault_device_sync_processing",
};

export const JOB_NAME_BY_KIND: Record<JobKindValue, string> = {
  [JOB_KIND.ALERT_EVALUATION]: "alert.evaluate",
  [JOB_KIND.REMINDER_GENERATION]: "reminder.generate",
  [JOB_KIND.DAILY_HEALTH_SUMMARY]: "summary.daily-generate",
  [JOB_KIND.DEVICE_SYNC_PROCESSING]: "device.sync-process",
};

export const JOB_ATTEMPTS_BY_KIND: Record<JobKindValue, number> = {
  [JOB_KIND.ALERT_EVALUATION]: 3,
  [JOB_KIND.REMINDER_GENERATION]: 3,
  [JOB_KIND.DAILY_HEALTH_SUMMARY]: 2,
  [JOB_KIND.DEVICE_SYNC_PROCESSING]: 5,
};

export const JOB_BACKOFF_DELAY_MS: Record<JobKindValue, number> = {
  [JOB_KIND.ALERT_EVALUATION]: 5000,
  [JOB_KIND.REMINDER_GENERATION]: 5000,
  [JOB_KIND.DAILY_HEALTH_SUMMARY]: 10000,
  [JOB_KIND.DEVICE_SYNC_PROCESSING]: 15000,
};

export const DEFAULT_JOB_DASHBOARD_LIMIT = Number(
  process.env.JOB_DASHBOARD_LIMIT ?? "20"
);

export const DEFAULT_WORKER_CONCURRENCY = Number(
  process.env.WORKER_CONCURRENCY ?? "5"
);