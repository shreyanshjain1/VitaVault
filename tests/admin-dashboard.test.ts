import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppRole, CareAccessStatus, JobRunStatus, ReminderState } from "@prisma/client";

const countMock = vi.fn();
const userFindManyMock = vi.fn();
const careInviteFindManyMock = vi.fn();
const jobRunFindManyMock = vi.fn();
const accessAuditFindManyMock = vi.fn();
const alertAuditFindManyMock = vi.fn();
const reminderAuditFindManyMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      count: countMock,
      findMany: userFindManyMock,
    },
    careInvite: {
      count: countMock,
      findMany: careInviteFindManyMock,
    },
    careAccess: {
      count: countMock,
    },
    alertEvent: {
      count: countMock,
    },
    jobRun: {
      count: countMock,
      findMany: jobRunFindManyMock,
    },
    mobileSessionToken: {
      count: countMock,
    },
    accessAuditLog: {
      findMany: accessAuditFindManyMock,
    },
    alertAuditLog: {
      findMany: alertAuditFindManyMock,
    },
    reminderAuditLog: {
      findMany: reminderAuditFindManyMock,
    },
  },
}));

describe("admin workspace data", () => {
  beforeEach(() => {
    vi.resetModules();
    countMock.mockReset();
    userFindManyMock.mockReset();
    careInviteFindManyMock.mockReset();
    jobRunFindManyMock.mockReset();
    accessAuditFindManyMock.mockReset();
    alertAuditFindManyMock.mockReset();
    reminderAuditFindManyMock.mockReset();
  });

  it("aggregates summary, recent lists, and merged audit feed", async () => {
    countMock
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(6);

    userFindManyMock
      .mockResolvedValueOnce([
        {
          id: "u2",
          name: "Bob",
          email: "bob@example.com",
          role: AppRole.PATIENT,
          emailVerified: null,
          createdAt: new Date("2026-04-24T02:00:00.000Z"),
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "u1",
          name: "Alice",
          email: "alice@example.com",
          role: AppRole.PATIENT,
          emailVerified: new Date(),
          createdAt: new Date("2026-04-24T01:00:00.000Z"),
          _count: { reminders: 2, alertEvents: 1, documents: 3, mobileSessionTokens: 1 },
        },
      ]);

    careInviteFindManyMock.mockResolvedValue([
      {
        id: "invite_1",
        email: "care@example.com",
        accessRole: "CAREGIVER",
        status: CareAccessStatus.PENDING,
        createdAt: new Date("2026-04-24T03:00:00.000Z"),
        expiresAt: new Date("2026-04-30T00:00:00.000Z"),
        owner: { id: "u1", name: "Alice", email: "alice@example.com" },
        grantedBy: { id: "u1", name: "Alice", email: "alice@example.com" },
      },
    ]);

    jobRunFindManyMock.mockResolvedValue([
      {
        id: "job_1",
        jobKind: "ALERT_SCAN",
        jobName: "Alert scan",
        queueName: "alerts",
        status: JobRunStatus.FAILED,
        createdAt: new Date("2026-04-24T05:00:00.000Z"),
        errorMessage: "Boom",
        user: { id: "u1", name: "Alice", email: "alice@example.com" },
      },
    ]);

    accessAuditFindManyMock.mockResolvedValue([
      {
        id: "access_1",
        action: "GRANTED",
        targetType: "CareAccess",
        targetId: "access_1",
        metadataJson: "Granted by admin",
        createdAt: new Date("2026-04-24T03:30:00.000Z"),
        owner: { id: "u1", name: "Alice", email: "alice@example.com" },
        actor: { id: "u9", name: "Admin", email: "admin@example.com" },
      },
    ]);

    alertAuditFindManyMock.mockResolvedValue([
      {
        id: "alert_log_1",
        action: "ACKNOWLEDGED",
        note: "Handled by clinician",
        createdAt: new Date("2026-04-24T04:00:00.000Z"),
        user: { id: "u1", name: "Alice", email: "alice@example.com" },
        actor: { id: "u3", name: "Clinician", email: "clinician@example.com" },
        alert: { id: "alert_1", title: "Critical BP" },
        rule: null,
      },
    ]);

    reminderAuditFindManyMock.mockResolvedValue([
      {
        id: "reminder_log_1",
        action: "EMAIL_SENT",
        note: "Reminder emailed",
        createdAt: new Date("2026-04-24T04:30:00.000Z"),
        user: { id: "u1", name: "Alice", email: "alice@example.com" },
        actor: { id: "sys", name: "System", email: "system@example.com" },
        reminder: { id: "rem_1", title: "Morning meds", state: ReminderState.SENT },
      },
    ]);

    const { getAdminWorkspaceData } = await import("@/lib/admin-dashboard");
    const data = await getAdminWorkspaceData();

    expect(data.summary.totalUsers).toBe(2);
    expect(data.summary.pendingInvites).toBe(3);
    expect(data.summary.activeCareAccess).toBe(4);
    expect(data.userRoster).toHaveLength(1);
    expect(data.userRoster[0].role).toBe(AppRole.PATIENT);
    expect(data.userRoster[0]._count.alertEvents).toBe(1);
    expect(data.recentUsers[0].email).toBe("bob@example.com");
    expect(data.recentInvites[0].email).toBe("care@example.com");
    expect(data.recentJobRuns[0].jobKind).toBe("ALERT_SCAN");
    expect(data.auditFeed).toHaveLength(3);
    expect(data.auditFeed[0].source).toBe("REMINDER");
    expect(data.auditFeed[1].source).toBe("ALERT");
    expect(data.auditFeed[2].source).toBe("ACCESS");
  });
});
