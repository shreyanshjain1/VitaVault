import { JOB_NAMES } from "@/lib/jobs/contracts";

type JsonRecord = Record<string, unknown>;

export type JobRunFilterStatus =
  | "all"
  | "QUEUED"
  | "ACTIVE"
  | "RETRYING"
  | "FAILED"
  | "COMPLETED"
  | "CANCELLED";

export type JobRunFilterKind =
  | "all"
  | "ALERT_EVALUATION"
  | "REMINDER_GENERATION"
  | "DAILY_HEALTH_SUMMARY"
  | "DEVICE_SYNC_PROCESSING";

export type JobRunOpsFilter = {
  status: JobRunFilterStatus;
  kind: JobRunFilterKind;
  q: string;
  review: "all" | "failed" | "device";
};

export type JobRunSummaryInput = {
  status: string;
  jobKind: string;
  attemptsMade: number;
  maxAttempts: number;
  errorMessage?: string | null;
  connectionId?: string | null;
  syncJobId?: string | null;
};

export type RetryableJobRunInput = {
  id: string;
  jobName: string;
  userId?: string | null;
  connectionId?: string | null;
  syncJobId?: string | null;
  inputJson?: string | null;
};

export type RetryDispatchPayload =
  | {
      jobType: "alert-evaluation";
      userId: string;
      sourceType?: "VITAL_RECORD" | "MEDICATION_LOG" | "SYMPTOM_ENTRY" | "SYNC_JOB" | "DEVICE_READING" | "SCHEDULED_SCAN" | null;
      sourceId?: string | null;
      sourceRecordedAt?: string | null;
      initiatedBy?: "record_create" | "scheduled_scan" | "manual_scan" | "sync_finish";
    }
  | {
      jobType: "reminder-generation";
      userId: string;
      timezone?: string | null;
      targetDate?: string | null;
    }
  | {
      jobType: "reminder-overdue-evaluation";
      userId: string;
      timezone?: string | null;
    }
  | {
      jobType: "daily-health-summary";
      userId: string;
      targetDate?: string | null;
    }
  | {
      jobType: "device-sync-processing";
      userId: string;
      connectionId?: string | null;
      syncJobId?: string | null;
    };

const STATUS_VALUES: JobRunFilterStatus[] = [
  "all",
  "QUEUED",
  "ACTIVE",
  "RETRYING",
  "FAILED",
  "COMPLETED",
  "CANCELLED",
];

const KIND_VALUES: JobRunFilterKind[] = [
  "all",
  "ALERT_EVALUATION",
  "REMINDER_GENERATION",
  "DAILY_HEALTH_SUMMARY",
  "DEVICE_SYNC_PROCESSING",
];

function stringValue(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

function isAlertSourceType(value: unknown): value is "VITAL_RECORD" | "MEDICATION_LOG" | "SYMPTOM_ENTRY" | "SYNC_JOB" | "DEVICE_READING" | "SCHEDULED_SCAN" {
  return (
    value === "VITAL_RECORD" ||
    value === "MEDICATION_LOG" ||
    value === "SYMPTOM_ENTRY" ||
    value === "SYNC_JOB" ||
    value === "DEVICE_READING" ||
    value === "SCHEDULED_SCAN"
  );
}

function isAlertInitiatedBy(value: unknown): value is "record_create" | "scheduled_scan" | "manual_scan" | "sync_finish" {
  return value === "record_create" || value === "scheduled_scan" || value === "manual_scan" || value === "sync_finish";
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function parseJobRunOpsFilter(params: Record<string, string | string[] | undefined>): JobRunOpsFilter {
  const status = stringValue(params.status);
  const kind = stringValue(params.kind);
  const review = stringValue(params.review);

  return {
    status: STATUS_VALUES.includes(status as JobRunFilterStatus) ? (status as JobRunFilterStatus) : "all",
    kind: KIND_VALUES.includes(kind as JobRunFilterKind) ? (kind as JobRunFilterKind) : "all",
    q: stringValue(params.q).trim(),
    review: review === "failed" || review === "device" ? review : "all",
  };
}

export function parseJobRunJson(value: string | null | undefined): JsonRecord | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as JsonRecord;
    return null;
  } catch {
    return null;
  }
}

export function isRetryableJobRunStatus(status: string) {
  return status === "FAILED" || status === "RETRYING" || status === "CANCELLED";
}

export function isCancellableJobRunStatus(status: string) {
  return status === "QUEUED" || status === "ACTIVE" || status === "RETRYING";
}

export function jobRunTone(status: string): "neutral" | "info" | "success" | "warning" | "danger" {
  if (status === "COMPLETED") return "success";
  if (status === "FAILED") return "danger";
  if (status === "RETRYING" || status === "CANCELLED") return "warning";
  if (status === "ACTIVE") return "info";
  return "neutral";
}

export function buildJobRunOpsSummary(runs: JobRunSummaryInput[]) {
  const failed = runs.filter((run) => run.status === "FAILED").length;
  const retrying = runs.filter((run) => run.status === "RETRYING").length;
  const active = runs.filter((run) => run.status === "ACTIVE").length;
  const queued = runs.filter((run) => run.status === "QUEUED").length;
  const completed = runs.filter((run) => run.status === "COMPLETED").length;
  const cancellable = runs.filter((run) => isCancellableJobRunStatus(run.status)).length;
  const retryable = runs.filter((run) => isRetryableJobRunStatus(run.status)).length;
  const deviceRuns = runs.filter((run) => run.jobKind === "DEVICE_SYNC_PROCESSING" || run.connectionId || run.syncJobId).length;

  return {
    total: runs.length,
    failed,
    retrying,
    active,
    queued,
    completed,
    cancellable,
    retryable,
    deviceRuns,
    failureRate: runs.length ? Math.round(((failed + retrying) / runs.length) * 100) : 0,
  };
}

export function buildRetryDispatchPayload(run: RetryableJobRunInput): RetryDispatchPayload {
  const input = parseJobRunJson(run.inputJson) ?? {};
  const userId = asNullableString(input.userId) ?? run.userId;

  if (!userId) {
    throw new Error("This job run cannot be retried because it does not have a user id.");
  }

  switch (run.jobName) {
    case JOB_NAMES.alertEvaluation:
    case JOB_NAMES.alertScheduledScan:
      return {
        jobType: "alert-evaluation",
        userId,
        sourceType: isAlertSourceType(input.sourceType) ? input.sourceType : null,
        sourceId: asNullableString(input.sourceId),
        sourceRecordedAt: asNullableString(input.sourceRecordedAt) ?? new Date().toISOString(),
        initiatedBy: isAlertInitiatedBy(input.initiatedBy) ? input.initiatedBy : "manual_scan",
      };

    case JOB_NAMES.reminderGeneration:
      return {
        jobType: "reminder-generation",
        userId,
        timezone: asNullableString(input.timezone),
        targetDate: asNullableString(input.targetDate),
      };

    case JOB_NAMES.reminderOverdueEvaluation:
      return {
        jobType: "reminder-overdue-evaluation",
        userId,
        timezone: asNullableString(input.timezone),
      };

    case JOB_NAMES.dailyHealthSummary:
      return {
        jobType: "daily-health-summary",
        userId,
        targetDate: asNullableString(input.targetDate),
      };

    case JOB_NAMES.deviceSyncProcessing:
      return {
        jobType: "device-sync-processing",
        userId,
        connectionId: asNullableString(input.connectionId) ?? run.connectionId ?? null,
        syncJobId: asNullableString(input.syncJobId) ?? run.syncJobId ?? null,
      };

    default:
      throw new Error(`Unsupported retry job name: ${run.jobName}`);
  }
}

export function buildJobRunDeepLink(run: { id: string; connectionId?: string | null; syncJobId?: string | null }) {
  if (run.connectionId) return `/device-connection/${run.connectionId}`;
  if (run.syncJobId) return `/jobs?review=device&q=${encodeURIComponent(run.syncJobId)}`;
  return `/jobs?q=${encodeURIComponent(run.id)}`;
}
