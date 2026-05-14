import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {},
}));

vi.mock("@prisma/client", () => ({
  AlertSeverity: {
    CRITICAL: "CRITICAL",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW",
  },
  AlertStatus: {
    OPEN: "OPEN",
    ACKNOWLEDGED: "ACKNOWLEDGED",
    RESOLVED: "RESOLVED",
    DISMISSED: "DISMISSED",
  },
  AppRole: { ADMIN: "ADMIN", USER: "USER" },
  JobRunStatus: {
    FAILED: "FAILED",
    RETRYING: "RETRYING",
    CANCELLED: "CANCELLED",
    COMPLETED: "COMPLETED",
    RUNNING: "RUNNING",
    QUEUED: "QUEUED",
  },
  ReminderState: {
    MISSED: "MISSED",
    OVERDUE: "OVERDUE",
    COMPLETED: "COMPLETED",
    DUE: "DUE",
    SCHEDULED: "SCHEDULED",
  },
}));
import {
  buildAuditReviewChecklist,
  buildAuditReviewSummary,
  getAuditEventRiskSignal,
  type SecurityAuditEvent,
  type SecurityAuditSummary,
} from "../lib/audit-log";

const baseEvent: SecurityAuditEvent = {
  id: "event-1",
  source: "session",
  title: "Mobile session active",
  actor: "Demo Patient",
  owner: "Demo Patient",
  target: "Pixel 8",
  note: "Created recently",
  severity: "info",
  createdAt: new Date("2026-05-12T08:00:00.000Z"),
  metadata: "{}",
};

describe("audit log review helpers", () => {
  it("classifies failed or danger events as critical review", () => {
    const signal = getAuditEventRiskSignal({
      ...baseEvent,
      source: "job",
      title: "DAILY_SUMMARY · FAILED",
      note: "Worker failed after all retry attempts",
      severity: "danger",
    });

    expect(signal).toMatchObject({
      state: "critical",
      label: "Critical review",
      tone: "danger",
      actionLabel: "Inspect failed run",
    });
  });

  it("classifies revocation and warning events as review items", () => {
    const signal = getAuditEventRiskSignal({
      ...baseEvent,
      title: "Mobile session revoked",
      note: "Session was revoked by the owner",
      severity: "warning",
    });

    expect(signal.state).toBe("review");
    expect(signal.tone).toBe("warning");
    expect(signal.actionLabel).toBe("Review session");
  });

  it("builds review queue counts from visible events", () => {
    const summary = buildAuditReviewSummary([
      { ...baseEvent, severity: "danger", source: "job", title: "JOB FAILED" },
      {
        ...baseEvent,
        severity: "warning",
        title: "Mobile session revoked",
      },
      { ...baseEvent, severity: "info", source: "access" },
      { ...baseEvent, severity: "success", source: "reminder" },
    ]);

    expect(summary).toEqual({
      critical: 1,
      review: 1,
      monitor: 1,
      healthy: 1,
      reviewQueue: 2,
    });
  });

  it("builds a security audit checklist from summary counts", () => {
    const summary: SecurityAuditSummary = {
      totalEvents: 12,
      dangerEvents: 1,
      warningEvents: 2,
      activeMobileSessions: 3,
      failedJobs: 1,
      openAlerts: 4,
      reviewQueue: 3,
      criticalQueue: 1,
      monitorQueue: 2,
    };

    const checklist = buildAuditReviewChecklist(summary);

    expect(checklist.map((item) => item.id)).toEqual([
      "critical-events",
      "warnings",
      "jobs",
      "alerts",
    ]);
    expect(checklist[0]).toMatchObject({ passed: false, tone: "danger" });
    expect(checklist[1]).toMatchObject({ passed: false, tone: "warning" });
  });
});
