import { describe, expect, it } from "vitest";
import {
  buildJobRunDeepLink,
  buildJobRunOpsSummary,
  buildRetryDispatchPayload,
  isCancellableJobRunStatus,
  isRetryableJobRunStatus,
  parseJobRunJson,
  parseJobRunOpsFilter,
} from "@/lib/jobs/admin-tools";

describe("job admin tools", () => {
  it("parses safe dashboard filters", () => {
    expect(parseJobRunOpsFilter({ status: "FAILED", kind: "DEVICE_SYNC_PROCESSING", review: "device", q: "sync" })).toEqual({
      status: "FAILED",
      kind: "DEVICE_SYNC_PROCESSING",
      review: "device",
      q: "sync",
    });

    expect(parseJobRunOpsFilter({ status: "BROKEN", kind: "NOPE", review: "weird" })).toEqual({
      status: "all",
      kind: "all",
      review: "all",
      q: "",
    });
  });

  it("summarizes operational state from recent job runs", () => {
    const summary = buildJobRunOpsSummary([
      { status: "FAILED", jobKind: "DEVICE_SYNC_PROCESSING", attemptsMade: 3, maxAttempts: 3, connectionId: "conn_1" },
      { status: "RETRYING", jobKind: "ALERT_EVALUATION", attemptsMade: 1, maxAttempts: 3 },
      { status: "COMPLETED", jobKind: "DAILY_HEALTH_SUMMARY", attemptsMade: 1, maxAttempts: 3 },
      { status: "ACTIVE", jobKind: "REMINDER_GENERATION", attemptsMade: 0, maxAttempts: 3 },
    ]);

    expect(summary.failed).toBe(1);
    expect(summary.retrying).toBe(1);
    expect(summary.active).toBe(1);
    expect(summary.retryable).toBe(2);
    expect(summary.cancellable).toBe(2);
    expect(summary.deviceRuns).toBe(1);
    expect(summary.failureRate).toBe(50);
  });

  it("builds retry payloads from persisted job input", () => {
    const payload = buildRetryDispatchPayload({
      id: "run_1",
      jobName: "device-sync-processing",
      userId: "user_1",
      connectionId: "fallback_connection",
      syncJobId: "fallback_sync",
      inputJson: JSON.stringify({ userId: "user_1", connectionId: "conn_1", syncJobId: "sync_1" }),
    });

    expect(payload).toEqual({
      jobType: "device-sync-processing",
      userId: "user_1",
      connectionId: "conn_1",
      syncJobId: "sync_1",
    });
  });

  it("understands retryable and cancellable states", () => {
    expect(isRetryableJobRunStatus("FAILED")).toBe(true);
    expect(isRetryableJobRunStatus("COMPLETED")).toBe(false);
    expect(isCancellableJobRunStatus("QUEUED")).toBe(true);
    expect(isCancellableJobRunStatus("CANCELLED")).toBe(false);
  });

  it("parses json safely and builds useful deep links", () => {
    expect(parseJobRunJson('{"ok":true}')).toEqual({ ok: true });
    expect(parseJobRunJson("not-json")).toBeNull();
    expect(buildJobRunDeepLink({ id: "run_1", connectionId: "conn_1" })).toBe("/device-connection/conn_1");
    expect(buildJobRunDeepLink({ id: "run_2" })).toBe("/jobs?q=run_2");
  });
});
