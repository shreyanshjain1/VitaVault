import { db } from "@/lib/db";
import {
  JOB_RUN_STATUS,
  type JobKindValue,
} from "@/lib/domain/enums";
import {
  JOB_ATTEMPTS_BY_KIND,
  JOB_NAME_BY_KIND,
  JOB_QUEUE_NAMES,
} from "@/lib/jobs/constants";

type CreateJobRunInput = {
  kind: JobKindValue;
  userId?: string | null;
  connectionId?: string | null;
  syncJobId?: string | null;
  input?: unknown;
};

function stringifySafe(value: unknown) {
  if (value === undefined) return null;
  return JSON.stringify(value);
}

export async function createQueuedJobRun(input: CreateJobRunInput) {
  return db.jobRun.create({
    data: {
      queueName: JOB_QUEUE_NAMES[input.kind],
      jobName: JOB_NAME_BY_KIND[input.kind],
      jobKind: input.kind,
      status: JOB_RUN_STATUS.QUEUED,
      userId: input.userId ?? null,
      connectionId: input.connectionId ?? null,
      syncJobId: input.syncJobId ?? null,
      inputJson: stringifySafe(input.input),
      attemptsMade: 0,
      maxAttempts: JOB_ATTEMPTS_BY_KIND[input.kind],
    },
  });
}

export async function attachBullmqJobId(jobRunId: string, bullmqJobId: string) {
  return db.jobRun.update({
    where: { id: jobRunId },
    data: {
      bullmqJobId,
    },
  });
}

export async function markJobRunActive(
  jobRunId: string,
  attemptsMade: number,
  extra?: unknown
) {
  return db.jobRun.update({
    where: { id: jobRunId },
    data: {
      status: JOB_RUN_STATUS.ACTIVE,
      attemptsMade,
      startedAt: new Date(),
      errorMessage: null,
      resultJson: extra === undefined ? undefined : JSON.stringify(extra),
    },
  });
}

export async function markJobRunCompleted(
  jobRunId: string,
  attemptsMade: number,
  result?: unknown
) {
  return db.jobRun.update({
    where: { id: jobRunId },
    data: {
      status: JOB_RUN_STATUS.COMPLETED,
      attemptsMade,
      finishedAt: new Date(),
      errorMessage: null,
      resultJson: result === undefined ? null : JSON.stringify(result),
    },
  });
}

export async function markJobRunRetrying(
  jobRunId: string,
  attemptsMade: number,
  errorMessage: string
) {
  return db.jobRun.update({
    where: { id: jobRunId },
    data: {
      status: JOB_RUN_STATUS.RETRYING,
      attemptsMade,
      errorMessage,
    },
  });
}

export async function markJobRunFailed(
  jobRunId: string,
  attemptsMade: number,
  errorMessage: string
) {
  return db.jobRun.update({
    where: { id: jobRunId },
    data: {
      status: JOB_RUN_STATUS.FAILED,
      attemptsMade,
      finishedAt: new Date(),
      errorMessage,
    },
  });
}

export async function appendJobRunLog(
  jobRunId: string,
  level: "INFO" | "WARN" | "ERROR",
  message: string,
  context?: unknown
) {
  return db.jobRunLog.create({
    data: {
      jobRunId,
      level,
      message,
      contextJson: context === undefined ? null : JSON.stringify(context),
    },
  });
}