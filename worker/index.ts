import { Worker } from "bullmq";
import {
  DEFAULT_WORKER_CONCURRENCY,
  JOB_ATTEMPTS_BY_KIND,
  JOB_QUEUE_NAMES,
} from "../lib/jobs/constants";
import { parseJobPayload } from "../lib/jobs/contracts";
import {
  handleAlertEvaluationJob,
  handleDailyHealthSummaryJob,
  handleDeviceSyncProcessingJob,
  handleReminderGenerationJob,
} from "../lib/jobs/handlers";
import {
  appendJobRunLog,
  markJobRunActive,
  markJobRunCompleted,
  markJobRunFailed,
  markJobRunRetrying,
} from "../lib/jobs/job-run-store";
import { bullmqConnection } from "../lib/jobs/redis";
import { JOB_KIND, type JobKindValue } from "../lib/domain/enums";

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown worker error";
}

function createWorker(kind: JobKindValue) {
  return new Worker(
    JOB_QUEUE_NAMES[kind],
    async (job) => {
      const payload = parseJobPayload(kind, job.data);

      await markJobRunActive(payload.jobRunId, job.attemptsMade);
      await appendJobRunLog(payload.jobRunId, "INFO", "Worker picked up job.", {
        workerQueue: JOB_QUEUE_NAMES[kind],
        bullmqJobId: job.id,
        attemptsMade: job.attemptsMade,
      });

      switch (kind) {
        case JOB_KIND.ALERT_EVALUATION:
          return handleAlertEvaluationJob(payload);

        case JOB_KIND.REMINDER_GENERATION:
          return handleReminderGenerationJob(payload);

        case JOB_KIND.DAILY_HEALTH_SUMMARY:
          return handleDailyHealthSummaryJob(payload);

        case JOB_KIND.DEVICE_SYNC_PROCESSING:
          return handleDeviceSyncProcessingJob(payload);

        default:
          throw new Error(`Unsupported worker kind: ${String(kind)}`);
      }
    },
    {
      connection: bullmqConnection,
      concurrency: DEFAULT_WORKER_CONCURRENCY,
    }
  );
}

const workerKinds: JobKindValue[] = [
  JOB_KIND.ALERT_EVALUATION,
  JOB_KIND.REMINDER_GENERATION,
  JOB_KIND.DAILY_HEALTH_SUMMARY,
  JOB_KIND.DEVICE_SYNC_PROCESSING,
];

const workers = workerKinds.map((kind) => ({
  kind,
  worker: createWorker(kind),
}));

for (const item of workers) {
  const { kind, worker } = item;

  worker.on("ready", () => {
    console.log(`[worker:${kind}] ready on queue ${worker.name}`);
  });

  worker.on("completed", async (job, result) => {
    if (!job) return;

    const payload = parseJobPayload(kind, job.data);

    await markJobRunCompleted(payload.jobRunId, job.attemptsMade, result);
    await appendJobRunLog(payload.jobRunId, "INFO", "Job completed.", {
      bullmqJobId: job.id,
      attemptsMade: job.attemptsMade,
      result,
    });

    console.log(`[worker:${kind}] completed job ${job.id}`);
  });

  worker.on("failed", async (job, error) => {
    if (!job) return;

    const payload = parseJobPayload(kind, job.data);
    const errorMessage = toErrorMessage(error);
    const maxAttempts = job.opts.attempts ?? JOB_ATTEMPTS_BY_KIND[kind];

    if (job.attemptsMade < maxAttempts) {
      await markJobRunRetrying(payload.jobRunId, job.attemptsMade, errorMessage);
      await appendJobRunLog(
        payload.jobRunId,
        "WARN",
        "Job failed and will retry.",
        {
          bullmqJobId: job.id,
          attemptsMade: job.attemptsMade,
          maxAttempts,
          errorMessage,
        }
      );
    } else {
      await markJobRunFailed(payload.jobRunId, job.attemptsMade, errorMessage);
      await appendJobRunLog(
        payload.jobRunId,
        "ERROR",
        "Job failed permanently.",
        {
          bullmqJobId: job.id,
          attemptsMade: job.attemptsMade,
          maxAttempts,
          errorMessage,
        }
      );
    }

    console.error(`[worker:${kind}] failed job ${job.id}: ${errorMessage}`);
  });

  worker.on("error", (error) => {
    console.error(`[worker:${kind}] worker error:`, error);
  });
}

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Closing BullMQ workers...`);

  await Promise.allSettled(workers.map((item) => item.worker.close()));
  await bullmqConnection.quit();

  console.log("Workers closed.");
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

console.log("VitaVault background workers starting...");
console.log(`Worker concurrency: ${DEFAULT_WORKER_CONCURRENCY}`);
console.log("Queues:", JOB_QUEUE_NAMES);