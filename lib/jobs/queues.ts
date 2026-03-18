import { Queue } from "bullmq";
import { getRedisConnection } from "@/lib/jobs/connection";
import { QUEUE_NAMES } from "@/lib/jobs/contracts";

declare global {
  // eslint-disable-next-line no-var
  var __vitavaultQueues__:
    | {
        alertsQueue: Queue;
        remindersQueue: Queue;
        dailySummaryQueue: Queue;
        deviceSyncQueue: Queue;
      }
    | undefined;
}

function createQueues() {
  const connection = getRedisConnection();

  const defaultJobOptions = {
    attempts: 3,
    removeOnComplete: 100,
    removeOnFail: 200,
    backoff: {
      type: "exponential" as const,
      delay: 10_000,
    },
  };

  return {
    alertsQueue: new Queue(QUEUE_NAMES.alerts, {
      connection,
      defaultJobOptions,
    }),
    remindersQueue: new Queue(QUEUE_NAMES.reminders, {
      connection,
      defaultJobOptions,
    }),
    dailySummaryQueue: new Queue(QUEUE_NAMES.dailySummary, {
      connection,
      defaultJobOptions,
    }),
    deviceSyncQueue: new Queue(QUEUE_NAMES.deviceSync, {
      connection,
      defaultJobOptions,
    }),
  };
}

function getQueues() {
  if (!global.__vitavaultQueues__) {
    global.__vitavaultQueues__ = createQueues();
  }

  return global.__vitavaultQueues__;
}

export function getAlertQueue() {
  return getQueues().alertsQueue;
}

export function getRemindersQueue() {
  return getQueues().remindersQueue;
}

export function getDailySummaryQueue() {
  return getQueues().dailySummaryQueue;
}

export function getDeviceSyncQueue() {
  return getQueues().deviceSyncQueue;
}

export const alertsQueue = getAlertQueue();
export const remindersQueue = getRemindersQueue();
export const dailySummaryQueue = getDailySummaryQueue();
export const deviceSyncQueue = getDeviceSyncQueue();