import { Queue } from "bullmq";
import { getRedisConnection } from "@/lib/jobs/connection";
import { JOB_BACKOFF_DELAY_MS } from "@/lib/jobs/constants";
import { QUEUE_NAMES } from "@/lib/jobs/contracts";

declare global {
  // eslint-disable-next-line no-var
  var vitavaultQueues:
    | {
        alertsQueue?: Queue;
        remindersQueue?: Queue;
        dailySummaryQueue?: Queue;
        deviceSyncQueue?: Queue;
      }
    | undefined;
}

function getStore() {
  if (!globalThis.vitavaultQueues) {
    globalThis.vitavaultQueues = {};
  }
  return globalThis.vitavaultQueues;
}

function defaultJobOptions() {
  return {
    attempts: 3,
    removeOnComplete: 100,
    removeOnFail: 200,
    backoff: {
      type: "exponential" as const,
      delay: JOB_BACKOFF_DELAY_MS,
    },
  };
}

export function getAlertQueue() {
  const store = getStore();
  if (!store.alertsQueue) {
    store.alertsQueue = new Queue(QUEUE_NAMES.alerts, {
      connection: getRedisConnection(),
      defaultJobOptions: defaultJobOptions(),
    });
  }
  return store.alertsQueue;
}

export function getRemindersQueue() {
  const store = getStore();
  if (!store.remindersQueue) {
    store.remindersQueue = new Queue(QUEUE_NAMES.reminders, {
      connection: getRedisConnection(),
      defaultJobOptions: defaultJobOptions(),
    });
  }
  return store.remindersQueue;
}

export function getDailySummaryQueue() {
  const store = getStore();
  if (!store.dailySummaryQueue) {
    store.dailySummaryQueue = new Queue(QUEUE_NAMES.dailySummary, {
      connection: getRedisConnection(),
      defaultJobOptions: defaultJobOptions(),
    });
  }
  return store.dailySummaryQueue;
}

export function getDeviceSyncQueue() {
  const store = getStore();
  if (!store.deviceSyncQueue) {
    store.deviceSyncQueue = new Queue(QUEUE_NAMES.deviceSync, {
      connection: getRedisConnection(),
      defaultJobOptions: defaultJobOptions(),
    });
  }
  return store.deviceSyncQueue;
}

export const alertsQueue = getAlertQueue();
export const remindersQueue = getRemindersQueue();
export const dailySummaryQueue = getDailySummaryQueue();
export const deviceSyncQueue = getDeviceSyncQueue();