import type { JobsOptions } from "bullmq";
import type {
  AlertEvaluationJobData,
  DailyHealthSummaryJobData,
  DeviceSyncProcessingJobData,
  ReminderGenerationJobData,
} from "@/lib/jobs/contracts";
import {
  JOB_ATTEMPTS_BY_KIND,
  JOB_BACKOFF_DELAY_MS,
} from "@/lib/jobs/constants";
import {
  appendJobRunLog,
  attachBullmqJobId,
  createQueuedJobRun,
  markJobRunFailed,
} from "@/lib/jobs/job-run-store";
import {
  alertsQueue,
  dailySummaryQueue,
  deviceSyncQueue,
  getJobNameForKind,
  remindersQueue,
} from "@/lib/jobs/queues";
import { JOB_KIND, type JobKindValue } from "@/lib/domain/enums";

function buildJobOptions(kind: JobKindValue): JobsOptions {
  return {
    attempts: JOB_ATTEMPTS_BY_KIND[kind],
    backoff: {
      type: "exponential",
      delay: JOB_BACKOFF_DELAY_MS[kind],
    },
    jobId: undefined,
    removeOnComplete: 100,
    removeOnFail: 250,
  };
}

export async function enqueueAlertEvaluationJob(input: {
  userId: string;
  requestedByUserId?: string | null;
  source?: AlertEvaluationJobData["source"];
}) {
  const kind = JOB_KIND.ALERT_EVALUATION;
  const jobRun = await createQueuedJobRun({
    kind,
    userId: input.userId,
    input,
  });

  const payload: AlertEvaluationJobData = {
    jobRunId: jobRun.id,
    userId: input.userId,
    requestedByUserId: input.requestedByUserId ?? null,
    source: input.source ?? "manual",
  };

  try {
    const job = await alertsQueue.add(getJobNameForKind(kind), payload, {
      ...buildJobOptions(kind),
      jobId: jobRun.id,
    });

    await attachBullmqJobId(jobRun.id, String(job.id));
    await appendJobRunLog(jobRun.id, "INFO", "Alert evaluation job queued.", {
      queue: alertsQueue.name,
      bullmqJobId: job.id,
    });

    return { jobRunId: jobRun.id, bullmqJobId: String(job.id) };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to enqueue alert evaluation job.";
    await markJobRunFailed(jobRun.id, 0, message);
    await appendJobRunLog(jobRun.id, "ERROR", message);
    throw error;
  }
}

export async function enqueueReminderGenerationJob(input: {
  userId: string;
  requestedByUserId?: string | null;
  horizonDays?: number;
}) {
  const kind = JOB_KIND.REMINDER_GENERATION;
  const jobRun = await createQueuedJobRun({
    kind,
    userId: input.userId,
    input,
  });

  const payload: ReminderGenerationJobData = {
    jobRunId: jobRun.id,
    userId: input.userId,
    requestedByUserId: input.requestedByUserId ?? null,
    horizonDays: input.horizonDays ?? 7,
  };

  try {
    const job = await remindersQueue.add(getJobNameForKind(kind), payload, {
      ...buildJobOptions(kind),
      jobId: jobRun.id,
    });

    await attachBullmqJobId(jobRun.id, String(job.id));
    await appendJobRunLog(jobRun.id, "INFO", "Reminder generation job queued.", {
      queue: remindersQueue.name,
      bullmqJobId: job.id,
      horizonDays: payload.horizonDays,
    });

    return { jobRunId: jobRun.id, bullmqJobId: String(job.id) };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to enqueue reminder generation job.";
    await markJobRunFailed(jobRun.id, 0, message);
    await appendJobRunLog(jobRun.id, "ERROR", message);
    throw error;
  }
}

export async function enqueueDailyHealthSummaryJob(input: {
  userId: string;
  requestedByUserId?: string | null;
  targetDate?: string;
}) {
  const kind = JOB_KIND.DAILY_HEALTH_SUMMARY;
  const jobRun = await createQueuedJobRun({
    kind,
    userId: input.userId,
    input,
  });

  const payload: DailyHealthSummaryJobData = {
    jobRunId: jobRun.id,
    userId: input.userId,
    requestedByUserId: input.requestedByUserId ?? null,
    targetDate: input.targetDate,
  };

  try {
    const job = await dailySummaryQueue.add(getJobNameForKind(kind), payload, {
      ...buildJobOptions(kind),
      jobId: jobRun.id,
    });

    await attachBullmqJobId(jobRun.id, String(job.id));
    await appendJobRunLog(jobRun.id, "INFO", "Daily summary job queued.", {
      queue: dailySummaryQueue.name,
      bullmqJobId: job.id,
      targetDate: payload.targetDate ?? null,
    });

    return { jobRunId: jobRun.id, bullmqJobId: String(job.id) };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to enqueue daily health summary job.";
    await markJobRunFailed(jobRun.id, 0, message);
    await appendJobRunLog(jobRun.id, "ERROR", message);
    throw error;
  }
}

export async function enqueueDeviceSyncProcessingJob(input: {
  userId: string;
  connectionId: string;
  syncJobId: string;
  requestedByUserId?: string | null;
  triggeredBy?: DeviceSyncProcessingJobData["triggeredBy"];
}) {
  const kind = JOB_KIND.DEVICE_SYNC_PROCESSING;
  const jobRun = await createQueuedJobRun({
    kind,
    userId: input.userId,
    connectionId: input.connectionId,
    syncJobId: input.syncJobId,
    input,
  });

  const payload: DeviceSyncProcessingJobData = {
    jobRunId: jobRun.id,
    userId: input.userId,
    requestedByUserId: input.requestedByUserId ?? null,
    connectionId: input.connectionId,
    syncJobId: input.syncJobId,
    triggeredBy: input.triggeredBy ?? "manual",
  };

  try {
    const job = await deviceSyncQueue.add(getJobNameForKind(kind), payload, {
      ...buildJobOptions(kind),
      jobId: jobRun.id,
    });

    await attachBullmqJobId(jobRun.id, String(job.id));
    await appendJobRunLog(jobRun.id, "INFO", "Device sync processing job queued.", {
      queue: deviceSyncQueue.name,
      bullmqJobId: job.id,
      connectionId: input.connectionId,
      syncJobId: input.syncJobId,
    });

    return { jobRunId: jobRun.id, bullmqJobId: String(job.id) };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to enqueue device sync processing job.";
    await markJobRunFailed(jobRun.id, 0, message);
    await appendJobRunLog(jobRun.id, "ERROR", message);
    throw error;
  }
}