import { attachBullmqJobId, createJobRun } from "@/lib/jobs/job-run";
import {
  JOB_NAMES,
  QUEUE_NAMES,
  type AlertEvaluationJobPayload,
  type DailyHealthSummaryJobData,
  type DeviceSyncProcessingJobData,
  type ReminderGenerationJobData,
  type ReminderOverdueEvaluationJobData,
} from "@/lib/jobs/contracts";
import {
  getAlertQueue,
  getDailySummaryQueue,
  getDeviceSyncQueue,
  getRemindersQueue,
} from "@/lib/jobs/queues";

export async function enqueueAlertEvaluation(payload: AlertEvaluationJobPayload) {
  const queue = getAlertQueue();

  const jobRun = await createJobRun({
    queueName: QUEUE_NAMES.alerts,
    jobName: JOB_NAMES.alertEvaluation,
    userId: payload.userId,
    input: payload as Record<string, unknown>,
    maxAttempts: 3,
  });

  const job = await queue.add(JOB_NAMES.alertEvaluation, payload, {
    jobId: `alert-evaluation:${payload.userId}:${Date.now()}`,
  });

  await attachBullmqJobId(jobRun.id, String(job.id));

  return {
    jobRunId: jobRun.id,
    bullmqJobId: String(job.id),
  };
}

export async function enqueueAlertEvaluationJob(payload: AlertEvaluationJobPayload) {
  return enqueueAlertEvaluation(payload);
}

export async function enqueueAlertScheduledScan(userId: string) {
  return enqueueAlertEvaluation({
    userId,
    sourceType: "SCHEDULED_SCAN",
    sourceId: null,
    sourceRecordedAt: new Date().toISOString(),
    initiatedBy: "scheduled_scan",
  });
}

export async function enqueueReminderGenerationJob(payload: ReminderGenerationJobData) {
  const queue = getRemindersQueue();

  const jobRun = await createJobRun({
    queueName: QUEUE_NAMES.reminders,
    jobName: JOB_NAMES.reminderGeneration,
    userId: payload.userId,
    input: payload as Record<string, unknown>,
    maxAttempts: 3,
  });

  const job = await queue.add(JOB_NAMES.reminderGeneration, payload, {
    jobId: `reminder-generation:${payload.userId}:${Date.now()}`,
  });

  await attachBullmqJobId(jobRun.id, String(job.id));

  return {
    jobRunId: jobRun.id,
    bullmqJobId: String(job.id),
  };
}

export async function enqueueReminderOverdueEvaluationJob(
  payload: ReminderOverdueEvaluationJobData
) {
  const queue = getRemindersQueue();

  const jobRun = await createJobRun({
    queueName: QUEUE_NAMES.reminders,
    jobName: JOB_NAMES.reminderOverdueEvaluation,
    userId: payload.userId,
    input: payload as Record<string, unknown>,
    maxAttempts: 3,
  });

  const job = await queue.add(JOB_NAMES.reminderOverdueEvaluation, payload, {
    jobId: `reminder-overdue:${payload.userId}:${Date.now()}`,
  });

  await attachBullmqJobId(jobRun.id, String(job.id));

  return {
    jobRunId: jobRun.id,
    bullmqJobId: String(job.id),
  };
}

export async function enqueueDailyHealthSummaryJob(payload: DailyHealthSummaryJobData) {
  const queue = getDailySummaryQueue();

  const jobRun = await createJobRun({
    queueName: QUEUE_NAMES.dailySummary,
    jobName: JOB_NAMES.dailyHealthSummary,
    userId: payload.userId,
    input: payload as Record<string, unknown>,
    maxAttempts: 3,
  });

  const job = await queue.add(JOB_NAMES.dailyHealthSummary, payload, {
    jobId: `daily-health-summary:${payload.userId}:${Date.now()}`,
  });

  await attachBullmqJobId(jobRun.id, String(job.id));

  return {
    jobRunId: jobRun.id,
    bullmqJobId: String(job.id),
  };
}

export async function enqueueDeviceSyncProcessingJob(payload: DeviceSyncProcessingJobData) {
  const queue = getDeviceSyncQueue();

  const jobRun = await createJobRun({
    queueName: QUEUE_NAMES.deviceSync,
    jobName: JOB_NAMES.deviceSyncProcessing,
    userId: payload.userId,
    input: payload as Record<string, unknown>,
    maxAttempts: 3,
  });

  const job = await queue.add(JOB_NAMES.deviceSyncProcessing, payload, {
    jobId: `device-sync-processing:${payload.userId}:${Date.now()}`,
  });

  await attachBullmqJobId(jobRun.id, String(job.id));

  return {
    jobRunId: jobRun.id,
    bullmqJobId: String(job.id),
  };
}