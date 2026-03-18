import { Job } from "bullmq";
import { JobRunStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getJobKindByName } from "@/lib/jobs/contracts";

export async function createJobRun(args: {
  queueName: string;
  jobName: string;
  bullmqJobId?: string | null;
  userId?: string | null;
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
      inputJson: args.input ? JSON.stringify(args.input) : null,
      maxAttempts: args.maxAttempts ?? 0,
    },
  });
}

export async function attachBullmqJobId(internalJobRunId: string, bullmqJobId: string) {
  await db.jobRun.update({
    where: { id: internalJobRunId },
    data: {
      bullmqJobId,
    },
  });
}

export async function markJobRunStarted(bullmqJobId: string) {
  await db.jobRun.updateMany({
    where: { bullmqJobId },
    data: {
      status: "ACTIVE",
      startedAt: new Date(),
    },
  });
}

export async function markJobRunSucceeded(
  bullmqJobId: string,
  result: Record<string, unknown> | null
) {
  await db.jobRun.updateMany({
    where: { bullmqJobId },
    data: {
      status: "COMPLETED",
      finishedAt: new Date(),
      resultJson: result ? JSON.stringify(result) : null,
      errorMessage: null,
    },
  });
}

export async function markJobRunFailed(
  bullmqJobId: string,
  error: unknown,
  attemptsMade: number
) {
  await db.jobRun.updateMany({
    where: { bullmqJobId },
    data: {
      status: attemptsMade > 0 ? "RETRYING" : "FAILED",
      attemptsMade,
      finishedAt: new Date(),
      errorMessage: error instanceof Error ? error.message : "Unknown worker error",
    },
  });
}

export async function finalizeJobRunFailure(
  bullmqJobId: string,
  error: unknown,
  attemptsMade: number
) {
  await db.jobRun.updateMany({
    where: { bullmqJobId },
    data: {
      status: "FAILED",
      attemptsMade,
      finishedAt: new Date(),
      errorMessage: error instanceof Error ? error.message : "Unknown worker error",
    },
  });
}

export async function appendJobRunLog(args: {
  bullmqJobId: string;
  level: string;
  message: string;
  context?: Record<string, unknown> | null;
}) {
  const jobRun = await db.jobRun.findFirst({
    where: { bullmqJobId: args.bullmqJobId },
    select: { id: true },
  });

  if (!jobRun) {
    return;
  }

  await db.jobRunLog.create({
    data: {
      jobRunId: jobRun.id,
      level: args.level,
      message: args.message,
      contextJson: args.context ? JSON.stringify(args.context) : null,
    },
  });
}
