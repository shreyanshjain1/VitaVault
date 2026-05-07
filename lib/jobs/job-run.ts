import { db } from "@/lib/db";
import { getJobKindByName } from "@/lib/jobs/contracts";

export async function createJobRun(args: {
  queueName: string;
  jobName: string;
  bullmqJobId?: string | null;
  userId?: string | null;
  connectionId?: string | null;
  syncJobId?: string | null;
  input?: Record<string, unknown> | null;
  maxAttempts?: number;
}) {
  return db.jobRun.create({
    data: {
      queueName: args.queueName,
      jobName: args.jobName,
      jobKind: getJobKindByName(args.jobName),
      bullmqJobId: args.bullmqJobId ?? null,
      status: "QUEUED",
      userId: args.userId ?? null,
      connectionId: args.connectionId ?? null,
      syncJobId: args.syncJobId ?? null,
      inputJson: args.input ? JSON.stringify(args.input) : null,
      maxAttempts: args.maxAttempts ?? 0,
    },
  });
}

export async function attachBullmqJobId(jobRunId: string, bullmqJobId: string) {
  await db.jobRun.update({
    where: { id: jobRunId },
    data: { bullmqJobId },
  });
}