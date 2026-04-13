import { JobType, Queue } from "bullmq";
import { db } from "@/lib/db";
import { DEFAULT_JOB_DASHBOARD_LIMIT } from "@/lib/jobs/constants";
import { hasRedisConfig, shouldSkipRedisDuringBuild } from "@/lib/jobs/connection";
import {
  getAlertQueue,
  getDailySummaryQueue,
  getDeviceSyncQueue,
  getRemindersQueue,
} from "@/lib/jobs/queues";

type SafeQueue = Queue;

const EMPTY_COUNTS = {
  active: 0,
  completed: 0,
  delayed: 0,
  failed: 0,
  paused: 0,
  prioritized: 0,
  waiting: 0,
  "waiting-children": 0,
};

async function getSafeQueueCounts(label: string, queueFactory: () => SafeQueue) {
  try {
    const queue = queueFactory();

    const counts = await queue.getJobCounts(
      "active" as JobType,
      "completed" as JobType,
      "delayed" as JobType,
      "failed" as JobType,
      "paused" as JobType,
      "prioritized" as JobType,
      "waiting" as JobType,
      "waiting-children" as JobType
    );

    return { label, counts };
  } catch (error) {
    return {
      label,
      counts: EMPTY_COUNTS,
      error: error instanceof Error ? error.message : "Queue unavailable.",
    };
  }
}

function getEmptyQueueCounts() {
  return [
    { label: "Alert Evaluation", counts: EMPTY_COUNTS },
    { label: "Reminder Generation", counts: EMPTY_COUNTS },
    { label: "Daily Summary", counts: EMPTY_COUNTS },
    { label: "Device Sync", counts: EMPTY_COUNTS },
  ];
}

export async function getJobsDashboardData() {
  const skipRedis = shouldSkipRedisDuringBuild();
  const redisConfigured = hasRedisConfig();

  const queueCountsPromise =
    !redisConfigured || skipRedis
      ? Promise.resolve(getEmptyQueueCounts())
      : Promise.all([
          getSafeQueueCounts("Alert Evaluation", getAlertQueue),
          getSafeQueueCounts("Reminder Generation", getRemindersQueue),
          getSafeQueueCounts("Daily Summary", getDailySummaryQueue),
          getSafeQueueCounts("Device Sync", getDeviceSyncQueue),
        ]);

  const recentRunsPromise = db.jobRun.findMany({
    orderBy: { createdAt: "desc" },
    take: DEFAULT_JOB_DASHBOARD_LIMIT,
    include: {
      logs: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const [queueCounts, recentRuns] = await Promise.all([queueCountsPromise, recentRunsPromise]);

  let unavailableReason: string | null = null;
  if (!redisConfigured) {
    unavailableReason = "REDIS_URL is not configured.";
  } else if (skipRedis) {
    unavailableReason = "Redis-backed queue checks are skipped during build-time page collection.";
  }

  return {
    jobsAvailable: !unavailableReason,
    unavailableReason,
    queueCounts,
    recentRuns,
  };
}
