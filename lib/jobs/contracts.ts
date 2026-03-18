import { z } from "zod";
import { JOB_KIND, type JobKindValue } from "@/lib/domain/enums";

const baseJobEnvelopeSchema = z.object({
  jobRunId: z.string().min(1),
  userId: z.string().min(1),
  requestedByUserId: z.string().min(1).nullable().optional(),
});

export const alertEvaluationJobSchema = baseJobEnvelopeSchema.extend({
  source: z.enum(["manual", "schedule", "sync-hook"]).default("manual"),
});

export const reminderGenerationJobSchema = baseJobEnvelopeSchema.extend({
  horizonDays: z.number().int().min(1).max(30).default(7),
});

export const dailyHealthSummaryJobSchema = baseJobEnvelopeSchema.extend({
  targetDate: z.string().datetime().optional(),
});

export const deviceSyncProcessingJobSchema = baseJobEnvelopeSchema.extend({
  connectionId: z.string().min(1),
  syncJobId: z.string().min(1),
  triggeredBy: z.enum(["manual", "mobile-ingest", "schedule"]).default("manual"),
});

export type AlertEvaluationJobData = z.infer<typeof alertEvaluationJobSchema>;
export type ReminderGenerationJobData = z.infer<typeof reminderGenerationJobSchema>;
export type DailyHealthSummaryJobData = z.infer<typeof dailyHealthSummaryJobSchema>;
export type DeviceSyncProcessingJobData = z.infer<typeof deviceSyncProcessingJobSchema>;

export type JobPayloadMap = {
  ALERT_EVALUATION: AlertEvaluationJobData;
  REMINDER_GENERATION: ReminderGenerationJobData;
  DAILY_HEALTH_SUMMARY: DailyHealthSummaryJobData;
  DEVICE_SYNC_PROCESSING: DeviceSyncProcessingJobData;
};

export type AlertEvaluationJobResult = {
  evaluatedVitals: number;
  alerts: string[];
  informationalOnly: true;
  inspectedAt: string;
};

export type ReminderGenerationJobResult = {
  created: number;
  skippedDuplicates: number;
  appointmentsCreated: number;
  medicationRemindersCreated: number;
};

export type DailyHealthSummaryJobResult = {
  aiInsightId: string;
  title: string;
  trendFlags: string[];
  suggestedQuestions: string[];
};

export type DeviceSyncProcessingJobResult = {
  syncJobId: string;
  inspectedReadings: number;
  mirroredVitals: number;
  skippedReadings: number;
};

export type JobResultMap = {
  ALERT_EVALUATION: AlertEvaluationJobResult;
  REMINDER_GENERATION: ReminderGenerationJobResult;
  DAILY_HEALTH_SUMMARY: DailyHealthSummaryJobResult;
  DEVICE_SYNC_PROCESSING: DeviceSyncProcessingJobResult;
};

export function parseJobPayload<K extends JobKindValue>(
  kind: K,
  payload: unknown
): JobPayloadMap[K] {
  switch (kind) {
    case JOB_KIND.ALERT_EVALUATION:
      return alertEvaluationJobSchema.parse(payload) as JobPayloadMap[K];
    case JOB_KIND.REMINDER_GENERATION:
      return reminderGenerationJobSchema.parse(payload) as JobPayloadMap[K];
    case JOB_KIND.DAILY_HEALTH_SUMMARY:
      return dailyHealthSummaryJobSchema.parse(payload) as JobPayloadMap[K];
    case JOB_KIND.DEVICE_SYNC_PROCESSING:
      return deviceSyncProcessingJobSchema.parse(payload) as JobPayloadMap[K];
    default:
      throw new Error(`Unsupported job kind: ${String(kind)}`);
  }
}