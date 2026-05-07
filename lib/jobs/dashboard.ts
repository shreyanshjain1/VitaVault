import type { Prisma } from "@prisma/client";
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
import {
  buildJobRunOpsSummary,
  type JobRunOpsFilter,
} from "@/lib/jobs/admin-tools";

type SafeQueue = Queue;

type JobsDashboardOptions = {
  filters?: JobRunOpsFilter;
};

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

function buildJobRunWhere(filters?: JobRunOpsFilter): Prisma.JobRunWhereInput {
  const where: Prisma.JobRunWhereInput = {};

  if (!filters) return where;

  if (filters.status !== "all") {
    where.status = filters.status;
  }

  if (filters.kind !== "all") {
    where.jobKind = filters.kind;
  }

  if (filters.review === "failed") {
    where.status = { in: ["FAILED", "RETRYING"] };
  }

  if (filters.review === "device") {
    where.OR = [
      { jobKind: "DEVICE_SYNC_PROCESSING" },
      { connectionId: { not: null } },
      { syncJobId: { not: null } },
    ];
  }

  if (filters.q) {
    const queryFilter: Prisma.JobRunWhereInput = {
      OR: [
        { id: { contains: filters.q, mode: "insensitive" } },
        { jobName: { contains: filters.q, mode: "insensitive" } },
        { queueName: { contains: filters.q, mode: "insensitive" } },
        { errorMessage: { contains: filters.q, mode: "insensitive" } },
        { bullmqJobId: { contains: filters.q, mode: "insensitive" } },
        { connectionId: { contains: filters.q, mode: "insensitive" } },
        { syncJobId: { contains: filters.q, mode: "insensitive" } },
      ],
    };

    if (where.OR) {
      where.AND = [{ OR: where.OR }, queryFilter];
      where.OR = undefined;
    } else {
      where.OR = queryFilter.OR;
    }
  }

  return where;
}

export async function getJobsDashboardData(options: JobsDashboardOptions = {}) {
  const skipRedis = shouldSkipRedisDuringBuild();
  const redisConfigured = hasRedisConfig();
  const filters = options.filters;
  const jobRunWhere = buildJobRunWhere(filters);

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
    where: jobRunWhere,
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
      connection: {
        select: {
          id: true,
          source: true,
          status: true,
          deviceLabel: true,
          clientDeviceId: true,
        },
      },
    },
  });

  const recentForSummaryPromise = db.jobRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      status: true,
      jobKind: true,
      attemptsMade: true,
      maxAttempts: true,
      errorMessage: true,
      connectionId: true,
      syncJobId: true,
    },
  });

  const [queueCounts, recentRuns, recentForSummary, totalRuns, failedRuns, activeRuns] = await Promise.all([
    queueCountsPromise,
    recentRunsPromise,
    recentForSummaryPromise,
    db.jobRun.count(),
    db.jobRun.count({ where: { status: { in: ["FAILED", "RETRYING"] } } }),
    db.jobRun.count({ where: { status: { in: ["QUEUED", "ACTIVE"] } } }),
  ]);

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
    filters,
    summary: {
      ...buildJobRunOpsSummary(recentForSummary),
      totalRuns,
      failedRuns,
      activeRuns,
    },
  };
}
