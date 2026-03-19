import type { Job } from "bullmq";
import type { AlertEvaluationJobPayload } from "@/lib/jobs/contracts";
import { runAlertEvaluation } from "@/lib/alerts/service";

export async function processAlertEvaluation(job: Job<AlertEvaluationJobPayload>) {
  return runAlertEvaluation(job.data);
}