import { createJobRun, attachBullmqJobId } from "@/lib/jobs/job-run";
import { JOB_NAMES, QUEUE_NAMES, type AlertEvaluationJobPayload } from "@/lib/jobs/contracts";
import { getAlertQueue } from "@/lib/jobs/queues";

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

export async function enqueueAlertScheduledScan(userId: string) {
  const payload: AlertEvaluationJobPayload = {
    userId,
    sourceType: "SCHEDULED_SCAN",
    sourceId: null,
    sourceRecordedAt: new Date().toISOString(),
    initiatedBy: "scheduled_scan",
  };

  return enqueueAlertEvaluation(payload);
}
