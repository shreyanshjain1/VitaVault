import type { Job } from "bullmq";
import type { AlertEvaluationJobPayload } from "@/lib/jobs/contracts";
import {
  appendJobRunLog,
  finalizeJobRunFailure,
  markJobRunFailed,
  markJobRunStarted,
  markJobRunSucceeded,
} from "@/lib/jobs/job-run";
import { runAlertEvaluation } from "@/lib/alerts/service";

export async function processAlertEvaluation(
  job: Job<AlertEvaluationJobPayload>
) {
  const jobId = String(job.id);

  await markJobRunStarted(jobId);
  await appendJobRunLog({
    bullmqJobId: jobId,
    level: "info",
    message: "Alert evaluation worker started.",
    context: { payload: job.data },
  });

  try {
    const result = await runAlertEvaluation(job.data);

    await appendJobRunLog({
      bullmqJobId: jobId,
      level: "info",
      message: "Alert evaluation worker completed.",
      context: result,
    });

    await markJobRunSucceeded(jobId, result);
    return result;
  } catch (error) {
    await appendJobRunLog({
      bullmqJobId: jobId,
      level: "error",
      message: error instanceof Error ? error.message : "Unknown worker error",
    });

    if (job.attemptsMade + 1 >= (job.opts.attempts ?? 1)) {
      await finalizeJobRunFailure(jobId, error, job.attemptsMade + 1);
    } else {
      await markJobRunFailed(jobId, error, job.attemptsMade + 1);
    }

    throw error;
  }
}
