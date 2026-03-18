import { Queue } from "bullmq";
import { getRedisConnection } from "@/lib/jobs/connection";
import { QUEUE_NAMES } from "@/lib/jobs/contracts";

declare global {
  // eslint-disable-next-line no-var
  var __vitavaultQueues__:
    | {
        alertsQueue?: Queue;
        remindersQueue?: Queue;
        dailySummaryQueue?: Queue;
        deviceSyncQueue?: Queue;
      }
    | undefined;
}

function getQueueStore() {
  if (!global.__vitavaultQueues__) {
    global.__vitavaultQueues__ = {};
  }

  return global.__vitavaultQueues__;
}

function getDefaultJobOptions() {
  return {
    attempts: 3,
    removeOnComplete: 100,
    removeOnFail: 200,
    backoff: {
      type: "exponential" as const,
      delay: 10_000,
    },
  };
}

export function getAlertQueue() {
  const store = getQueueStore();

  if (!store.alertsQueue) {
    store.alertsQueue = new Queue(QUEUE_NAMES.alerts, {
      connection: getRedisConnection(),
      defaultJobOptions: getDefaultJobOptions(),
    });
  }

  return store.alertsQueue;
}

export function getRemindersQueue() {
  const store = getQueueStore();

  if (!store.remindersQueue) {
    store.remindersQueue = new Queue(QUEUE_NAMES.reminders, {
      connection: getRedisConnection(),
      defaultJobOptions: getDefaultJobOptions(),
    });
  }

  return store.remindersQueue;
}

export function getDailySummaryQueue() {
  const store = getQueueStore();

  if (!store.dailySummaryQueue) {
    store.dailySummaryQueue = new Queue(QUEUE_NAMES.dailySummary, {
      connection: getRedisConnection(),
      defaultJobOptions: getDefaultJobOptions(),
    });
  }

  return store.dailySummaryQueue;
}

export function getDeviceSyncQueue() {
  const store = getQueueStore();

  if (!store.deviceSyncQueue) {
    store.deviceSyncQueue = new Queue(QUEUE_NAMES.deviceSync, {
      connection: getRedisConnection(),
      defaultJobOptions: getDefaultJobOptions(),
    });
  }

  return store.deviceSyncQueue;
}