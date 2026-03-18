import { Queue } from "bullmq";
import type {
  AlertEvaluationJobData,
  DailyHealthSummaryJobData,
  DeviceSyncProcessingJobData,
  ReminderGenerationJobData,
} from "@/lib/jobs/contracts";
import {
  JOB_ATTEMPTS_BY_KIND,
  JOB_BACKOFF_DELAY_MS,
  JOB_NAME_BY_KIND,
  JOB_QUEUE_NAMES,
} from "@/lib/jobs/constants";
import { bullmqConnection } from "@/lib/jobs/redis";
import { JOB_KIND, type JobKindValue } from "@/lib/domain/enums";

declare global {
  // eslint-disable-next-line no-var
  var vitavaultQueues:
    | {
        alertsQueue: Queue<AlertEvaluationJobData>;
        remindersQueue: Queue<ReminderGenerationJobData>;
        dailySummaryQueue: Queue<DailyHealthSummaryJobData>;
        deviceSyncQueue: Queue<DeviceSyncProcessingJobData>;
      }
    | undefined;
}

function buildQueue<T>(kind: JobKindValue) {
  return new Queue<T>(JOB_QUEUE_NAMES[kind], {
    connection: bullmqConnection,
    defaultJobOptions: {
      attempts: JOB_ATTEMPTS_BY_KIND[kind],
      backoff: {
        type: "exponential",
        delay: JOB_BACKOFF_DELAY_MS[kind],
      },
      removeOnComplete: 100,
      removeOnFail: 250,
    },
  });
}

const queueRegistry =
  globalThis.vitavaultQueues ??
  {
    alertsQueue: buildQueue<AlertEvaluationJobData>(JOB_KIND.ALERT_EVALUATION),
    remindersQueue: buildQueue<ReminderGenerationJobData>(
      JOB_KIND.REMINDER_GENERATION
    ),
    dailySummaryQueue: buildQueue<DailyHealthSummaryJobData>(
      JOB_KIND.DAILY_HEALTH_SUMMARY
    ),
    deviceSyncQueue: buildQueue<DeviceSyncProcessingJobData>(
      JOB_KIND.DEVICE_SYNC_PROCESSING
    ),
  };

if (process.env.NODE_ENV !== "production") {
  globalThis.vitavaultQueues = queueRegistry;
}

export const alertsQueue = queueRegistry.alertsQueue;
export const remindersQueue = queueRegistry.remindersQueue;
export const dailySummaryQueue = queueRegistry.dailySummaryQueue;
export const deviceSyncQueue = queueRegistry.deviceSyncQueue;

export function getQueueForKind(kind: JobKindValue) {
  switch (kind) {
    case JOB_KIND.ALERT_EVALUATION:
      return alertsQueue;
    case JOB_KIND.REMINDER_GENERATION:
      return remindersQueue;
    case JOB_KIND.DAILY_HEALTH_SUMMARY:
      return dailySummaryQueue;
    case JOB_KIND.DEVICE_SYNC_PROCESSING:
      return deviceSyncQueue;
    default:
      throw new Error(`Unsupported queue kind: ${String(kind)}`);
  }
}

export function getJobNameForKind(kind: JobKindValue) {
  return JOB_NAME_BY_KIND[kind];
}