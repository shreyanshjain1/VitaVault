import { db } from "@/lib/db";
import { APP_ROLES } from "@/lib/domain/enums";
import { DEFAULT_JOB_DASHBOARD_LIMIT } from "@/lib/jobs/constants";
import {
  alertsQueue,
  dailySummaryQueue,
  deviceSyncQueue,
  remindersQueue,
} from "@/lib/jobs/queues";

async function getSafeQueueCounts(
  label: string,
  queue: {
    name: string;
    getJobCounts: (...types: string[]) => Promise<Record<string, number>>;
  }
) {
  try {
    const counts = await queue.getJobCounts(
      "waiting",
      "active",
      "completed",
      "failed",
      "delayed",
      "paused"
    );

    return {
      label,
      queueName: queue.name,
      healthy: true,
      counts,
      error: null as string | null,
    };
  } catch (error) {
    return {
      label,
      queueName: queue.name,
      healthy: false,
      counts: {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
      },
      error: error instanceof Error ? error.message : "Unknown Redis error",
    };
  }
}

export async function getJobsDashboardData(viewer: {
  id: string;
  role: string;
}) {
  const [queues, recentRuns] = await Promise.all([
    Promise.all([
      getSafeQueueCounts("Alert Evaluation", alertsQueue),
      getSafeQueueCounts("Reminder Generation", remindersQueue),
      getSafeQueueCounts("Daily Summary", dailySummaryQueue),
      getSafeQueueCounts("Device Sync", deviceSyncQueue),
    ]),
    db.jobRun.findMany({
      where:
        viewer.role === APP_ROLES.ADMIN
          ? undefined
          : {
              userId: viewer.id,
            },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        connection: {
          select: {
            id: true,
            deviceLabel: true,
            source: true,
            status: true,
          },
        },
        syncJob: {
          select: {
            id: true,
            status: true,
            requestedCount: true,
            mirroredCount: true,
          },
        },
        logs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 4,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: DEFAULT_JOB_DASHBOARD_LIMIT,
    }),
  ]);

  return {
    queues,
    recentRuns,
    redisHealthy: queues.every((queue) => queue.healthy),
  };
}