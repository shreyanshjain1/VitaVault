import { JobType, Queue } from "bullmq";
import { db } from "@/lib/db";
import { DEFAULT_JOB_DASHBOARD_LIMIT } from "@/lib/jobs/constants";
import {
  getAlertQueue,
  getDailySummaryQueue,
  getDeviceSyncQueue,
  getRemindersQueue,
} from "@/lib/jobs/queues";

type SafeQueue = Queue;

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
  } catch {
    return {
      label,
      counts: {
        active: 0,
        completed: 0,
        delayed: 0,
        failed: 0,
        paused: 0,
        prioritized: 0,
        waiting: 0,
        "waiting-children": 0,
      },
    };
  }
}

export async function getJobsDashboardData() {
  const [queueCounts, recentRuns] = await Promise.all([
    Promise.all([
      getSafeQueueCounts("Alert Evaluation", getAlertQueue),
      getSafeQueueCounts("Reminder Generation", getRemindersQueue),
      getSafeQueueCounts("Daily Summary", getDailySummaryQueue),
      getSafeQueueCounts("Device Sync", getDeviceSyncQueue),
    ]),
    db.jobRun.findMany({
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
    }),
  ]);

  return {
    queueCounts,
    recentRuns,
  };
}