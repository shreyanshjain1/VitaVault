import { Worker } from "bullmq";
import { getRedisConnection } from "@/lib/jobs/connection";
import {
  JOB_NAMES,
  QUEUE_NAMES,
  type AlertEvaluationJobPayload,
  type ReminderGenerationJobData,
  type ReminderOverdueEvaluationJobData,
} from "@/lib/jobs/contracts";
import { processAlertEvaluation } from "@/worker/processors/alert-evaluation";
import {
  handleReminderGenerationJob,
  handleReminderOverdueEvaluationJob,
} from "@/lib/jobs/handlers";

const connection = getRedisConnection();

const alertsWorker = new Worker<AlertEvaluationJobPayload>(
  QUEUE_NAMES.alerts,
  async (job) => {
    switch (job.name) {
      case JOB_NAMES.alertEvaluation:
      case JOB_NAMES.alertScheduledScan:
        return processAlertEvaluation(job);
      default:
        throw new Error(`Unsupported alert job name: ${job.name}`);
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

const remindersWorker = new Worker<
  ReminderGenerationJobData | ReminderOverdueEvaluationJobData
>(
  QUEUE_NAMES.reminders,
  async (job) => {
    switch (job.name) {
      case JOB_NAMES.reminderGeneration:
        return handleReminderGenerationJob(job.data as ReminderGenerationJobData);
      case JOB_NAMES.reminderOverdueEvaluation:
        return handleReminderOverdueEvaluationJob(
          job.data as ReminderOverdueEvaluationJobData
        );
      default:
        throw new Error(`Unsupported reminder job name: ${job.name}`);
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

alertsWorker.on("ready", () => {
  console.log("[worker] alerts worker ready");
});

remindersWorker.on("ready", () => {
  console.log("[worker] reminders worker ready");
});

alertsWorker.on("failed", (job, error) => {
  console.error(`[worker] failed ${job?.name} (${job?.id})`, error);
});

remindersWorker.on("failed", (job, error) => {
  console.error(`[worker] failed ${job?.name} (${job?.id})`, error);
});