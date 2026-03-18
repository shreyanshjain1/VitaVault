import { JobType, Queue } from "bullmq";
import {
  alertsQueue,
  dailySummaryQueue,
  deviceSyncQueue,
  remindersQueue,
} from "@/lib/jobs/queues";
import { db } from "@/lib/db";

type SafeQueue = Queue;

async function getSafeQueueCounts(label: string, queue: SafeQueue) {
  try {
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

    return {
      label,
      counts,
    };
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
      getSafeQueueCounts("Alert Evaluation", alertsQueue),
      getSafeQueueCounts("Reminder Generation", remindersQueue),
      getSafeQueueCounts("Daily Summary", dailySummaryQueue),
      getSafeQueueCounts("Device Sync", deviceSyncQueue),
    ]),
    db.jobRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
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