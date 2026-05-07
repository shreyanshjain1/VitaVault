"use server";

import { revalidatePath } from "next/cache";
import { AppRole } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  buildRetryDispatchPayload,
  isCancellableJobRunStatus,
  isRetryableJobRunStatus,
} from "@/lib/jobs/admin-tools";
import {
  enqueueAlertEvaluationJob,
  enqueueDailyHealthSummaryJob,
  enqueueDeviceSyncProcessingJob,
  enqueueReminderGenerationJob,
  enqueueReminderOverdueEvaluationJob,
} from "@/lib/jobs/enqueue";

function formString(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

async function requireAdminUser() {
  const user = await requireUser();
  if (user.role !== AppRole.ADMIN) {
    throw new Error("Only admins can manage background jobs.");
  }
  return user;
}

async function logJobAdminAction(args: {
  ownerUserId: string;
  actorUserId: string;
  action: string;
  jobRunId: string;
  metadata?: Record<string, unknown>;
}) {
  await db.accessAuditLog.create({
    data: {
      ownerUserId: args.ownerUserId,
      actorUserId: args.actorUserId,
      action: args.action,
      targetType: "JOB_RUN",
      targetId: args.jobRunId,
      metadataJson: args.metadata ? JSON.stringify(args.metadata) : null,
    },
  });
}

function revalidateJobSurfaces() {
  revalidatePath("/jobs");
  revalidatePath("/admin");
  revalidatePath("/audit-log");
  revalidatePath("/ops");
}

async function dispatchRetryPayload(payload: ReturnType<typeof buildRetryDispatchPayload>) {
  switch (payload.jobType) {
    case "alert-evaluation":
      return enqueueAlertEvaluationJob(payload);
    case "reminder-generation":
      return enqueueReminderGenerationJob(payload);
    case "reminder-overdue-evaluation":
      return enqueueReminderOverdueEvaluationJob(payload);
    case "daily-health-summary":
      return enqueueDailyHealthSummaryJob(payload);
    case "device-sync-processing":
      return enqueueDeviceSyncProcessingJob(payload);
  }
}

export async function retryJobRunAction(formData: FormData) {
  const admin = await requireAdminUser();
  const jobRunId = formString(formData, "jobRunId");

  if (!jobRunId) {
    throw new Error("Job run id is required.");
  }

  const run = await db.jobRun.findUnique({
    where: { id: jobRunId },
    select: {
      id: true,
      jobName: true,
      status: true,
      userId: true,
      connectionId: true,
      syncJobId: true,
      inputJson: true,
    },
  });

  if (!run) {
    throw new Error("Job run not found.");
  }

  if (!isRetryableJobRunStatus(run.status)) {
    throw new Error("Only failed, retrying, or cancelled job runs can be retried from this panel.");
  }

  const retryPayload = buildRetryDispatchPayload(run);
  const queued = await dispatchRetryPayload(retryPayload);

  await db.jobRunLog.create({
    data: {
      jobRunId: run.id,
      level: "INFO",
      message: "Admin queued a retry from the jobs dashboard.",
      contextJson: JSON.stringify({
        retryJobRunId: queued.jobRunId,
        retryBullmqJobId: queued.bullmqJobId,
        actorUserId: admin.id,
      }),
    },
  });

  await logJobAdminAction({
    ownerUserId: run.userId ?? admin.id!,
    actorUserId: admin.id!,
    action: "JOB_RUN_RETRY_QUEUED",
    jobRunId: run.id,
    metadata: {
      retryJobRunId: queued.jobRunId,
      retryBullmqJobId: queued.bullmqJobId,
      jobName: run.jobName,
    },
  });

  revalidateJobSurfaces();
}

export async function cancelJobRunAction(formData: FormData) {
  const admin = await requireAdminUser();
  const jobRunId = formString(formData, "jobRunId");

  if (!jobRunId) {
    throw new Error("Job run id is required.");
  }

  const run = await db.jobRun.findUnique({
    where: { id: jobRunId },
    select: {
      id: true,
      status: true,
      userId: true,
      jobName: true,
      bullmqJobId: true,
    },
  });

  if (!run) {
    throw new Error("Job run not found.");
  }

  if (!isCancellableJobRunStatus(run.status)) {
    throw new Error("Only queued, active, or retrying job runs can be marked cancelled.");
  }

  await db.jobRun.update({
    where: { id: run.id },
    data: {
      status: "CANCELLED",
      finishedAt: new Date(),
      errorMessage: "Marked cancelled by an admin from the Jobs dashboard.",
    },
  });

  await db.jobRunLog.create({
    data: {
      jobRunId: run.id,
      level: "WARN",
      message: "Admin marked this persisted job run as cancelled.",
      contextJson: JSON.stringify({ actorUserId: admin.id, bullmqJobId: run.bullmqJobId }),
    },
  });

  await logJobAdminAction({
    ownerUserId: run.userId ?? admin.id!,
    actorUserId: admin.id!,
    action: "JOB_RUN_CANCELLED",
    jobRunId: run.id,
    metadata: {
      jobName: run.jobName,
      previousStatus: run.status,
      bullmqJobId: run.bullmqJobId,
    },
  });

  revalidateJobSurfaces();
}

export async function acknowledgeJobRunAction(formData: FormData) {
  const admin = await requireAdminUser();
  const jobRunId = formString(formData, "jobRunId");

  if (!jobRunId) {
    throw new Error("Job run id is required.");
  }

  const run = await db.jobRun.findUnique({
    where: { id: jobRunId },
    select: {
      id: true,
      userId: true,
      status: true,
      jobName: true,
      errorMessage: true,
    },
  });

  if (!run) {
    throw new Error("Job run not found.");
  }

  await db.jobRunLog.create({
    data: {
      jobRunId: run.id,
      level: run.status === "FAILED" ? "WARN" : "INFO",
      message: "Admin acknowledged this job run for operational review.",
      contextJson: JSON.stringify({ actorUserId: admin.id, status: run.status, errorMessage: run.errorMessage }),
    },
  });

  await logJobAdminAction({
    ownerUserId: run.userId ?? admin.id!,
    actorUserId: admin.id!,
    action: "JOB_RUN_ACKNOWLEDGED",
    jobRunId: run.id,
    metadata: {
      jobName: run.jobName,
      status: run.status,
      errorMessage: run.errorMessage,
    },
  });

  revalidateJobSurfaces();
}
