import { Queue } from "bullmq";
import { getRedisConnection } from "@/lib/jobs/connection";
import { QUEUE_NAMES } from "@/lib/jobs/contracts";

declare global {
  // eslint-disable-next-line no-var
  var __vitavaultAlertQueue__: Queue | undefined;
}

export function getAlertQueue() {
  if (!global.__vitavaultAlertQueue__) {
    global.__vitavaultAlertQueue__ = new Queue(QUEUE_NAMES.alerts, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: 100,
        removeOnFail: 200,
        backoff: {
          type: "exponential",
          delay: 10_000,
        },
      },
    });
  }

  return global.__vitavaultAlertQueue__;
}
