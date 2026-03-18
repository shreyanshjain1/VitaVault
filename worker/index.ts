import { Worker } from "bullmq";
import { getRedisConnection } from "@/lib/jobs/connection";
import {
  JOB_NAMES,
  QUEUE_NAMES,
  type AlertEvaluationJobPayload,
} from "@/lib/jobs/contracts";
import { processAlertEvaluation } from "@/worker/processors/alert-evaluation";

const connection = getRedisConnection();

const worker = new Worker<AlertEvaluationJobPayload>(
  QUEUE_NAMES.alerts,
  async (job) => {
    switch (job.name) {
      case JOB_NAMES.alertEvaluation:
      case JOB_NAMES.alertScheduledScan:
        return processAlertEvaluation(job);
      default:
        throw new Error(`Unsupported job name: ${job.name}`);
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

worker.on("ready", () => {
  console.log("[worker] alerts worker ready");
});

worker.on("completed", (job) => {
  console.log(`[worker] completed ${job.name} (${job.id})`);
});

worker.on("failed", (job, error) => {
  console.error(`[worker] failed ${job?.name} (${job?.id})`, error);
});

worker.on("error", (error) => {
  console.error("[worker] fatal error", error);
});