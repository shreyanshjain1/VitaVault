import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AlertSeverity,
  AlertStatus,
  CareAccessStatus,
  DeviceConnectionStatus,
  LabFlag,
  ReminderState,
} from "@prisma/client";
import type { NotificationItem } from "@/lib/notification-center";

const alertFindManyMock = vi.fn();
const reminderFindManyMock = vi.fn();
const appointmentFindManyMock = vi.fn();
const labFindManyMock = vi.fn();
const documentFindManyMock = vi.fn();
const careInviteFindManyMock = vi.fn();
const deviceConnectionFindManyMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    alertEvent: { findMany: alertFindManyMock },
    reminder: { findMany: reminderFindManyMock },
    appointment: { findMany: appointmentFindManyMock },
    labResult: { findMany: labFindManyMock },
    medicalDocument: { findMany: documentFindManyMock },
    careInvite: { findMany: careInviteFindManyMock },
    deviceConnection: { findMany: deviceConnectionFindManyMock },
  },
}));

function baseNotification(
  overrides: Partial<NotificationItem> = {},
): NotificationItem {
  const now = new Date("2026-05-12T09:00:00.000Z");

  return {
    id: "notification_1",
    sourceId: "source_1",
    source: "REMINDER",
    title: "Follow-up item",
    description: "Review this workflow item.",
    priority: "medium",
    tone: "info",
    href: "/notifications",
    createdAt: now,
    dueAt: now,
    status: ReminderState.DUE,
    meta: "GENERAL",
    actionHint: "Review this item.",
    ...overrides,
  };
}

describe("notification center data", () => {
  beforeEach(() => {
    vi.resetModules();
    alertFindManyMock.mockReset();
    reminderFindManyMock.mockReset();
    appointmentFindManyMock.mockReset();
    labFindManyMock.mockReset();
    documentFindManyMock.mockReset();
    careInviteFindManyMock.mockReset();
    deviceConnectionFindManyMock.mockReset();
  });

  it("merges, prioritizes, and filters notification sources", async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    alertFindManyMock.mockResolvedValue([
      {
        id: "alert_1",
        title: "Critical blood pressure alert",
        message: "Blood pressure is outside the safe range.",
        severity: AlertSeverity.CRITICAL,
        status: AlertStatus.OPEN,
        category: "VITAL",
        createdAt: oneHourAgo,
      },
    ]);
    reminderFindManyMock.mockResolvedValue([
      {
        id: "reminder_1",
        title: "Take medication",
        description: "Morning dose",
        state: ReminderState.OVERDUE,
        type: "MEDICATION",
        dueAt: twoHoursAgo,
        createdAt: twoHoursAgo,
      },
    ]);
    appointmentFindManyMock.mockResolvedValue([
      {
        id: "appointment_1",
        purpose: "Follow-up visit",
        doctorName: "Dr. Santos",
        clinic: "Main Clinic",
        scheduledAt: tomorrow,
        createdAt: oneHourAgo,
      },
    ]);
    labFindManyMock.mockResolvedValue([
      {
        id: "lab_1",
        testName: "A1C",
        resultSummary: "Above range",
        flag: LabFlag.HIGH,
        dateTaken: twoHoursAgo,
        createdAt: twoHoursAgo,
      },
    ]);
    documentFindManyMock.mockResolvedValue([
      {
        id: "document_1",
        title: "Lab PDF",
        type: "LAB_RESULT",
        fileName: "lab.pdf",
        linkedRecordType: null,
        notes: null,
        createdAt: twoHoursAgo,
      },
    ]);
    careInviteFindManyMock.mockResolvedValue([
      {
        id: "invite_1",
        email: "care@example.com",
        accessRole: "CAREGIVER",
        status: CareAccessStatus.PENDING,
        expiresAt: tomorrow,
        createdAt: oneHourAgo,
      },
    ]);
    deviceConnectionFindManyMock.mockResolvedValue([
      {
        id: "device_1",
        source: "SMART_BP_MONITOR",
        platform: "demo",
        deviceLabel: "Smart BP Monitor",
        status: DeviceConnectionStatus.ERROR,
        lastSyncedAt: twoHoursAgo,
        lastError: "Sync failed",
        createdAt: twoHoursAgo,
        updatedAt: oneHourAgo,
      },
    ]);

    const { getNotificationCenterData } =
      await import("@/lib/notification-center");
    const allData = await getNotificationCenterData("user_1");
    const alertOnly = await getNotificationCenterData("user_1", {
      source: "ALERT",
    });
    const highOnly = await getNotificationCenterData("user_1", {
      priority: "high",
    });
    const urgentOnly = await getNotificationCenterData("user_1", {
      state: "urgent",
    });

    expect(allData.counts.total).toBe(7);
    expect(allData.counts.critical).toBe(1);
    expect(allData.counts.high).toBeGreaterThanOrEqual(3);
    expect(allData.items[0]?.priority).toBe("critical");
    expect(alertOnly.items).toHaveLength(1);
    expect(alertOnly.items[0]?.source).toBe("ALERT");
    expect(highOnly.items.every((item) => item.priority === "high")).toBe(true);
    expect(
      urgentOnly.items.every(
        (item) => item.priority === "critical" || item.source === "DEVICE",
      ),
    ).toBe(true);
    expect(
      allData.counts.bySource.find((item) => item.source === "DEVICE")?.count,
    ).toBe(1);
    expect(allData.reliability.urgent).toBeGreaterThanOrEqual(2);
    expect(allData.reliability.dueNow).toBe(1);
    expect(allData.reliability.actionable).toBeGreaterThan(0);
    expect(allData.nextActions).toContain(
      "Review urgent alerts, abnormal labs, or device errors first.",
    );
  });

  it("classifies urgent, due-now, follow-up, stale, and scheduled notification signals", async () => {
    const { buildNotificationReliabilitySummary, getNotificationItemSignal } =
      await import("@/lib/notification-center");
    const now = new Date("2026-05-12T09:00:00.000Z");
    const thirtyDaysAgo = new Date("2026-04-12T09:00:00.000Z");
    const tomorrow = new Date("2026-05-13T09:00:00.000Z");
    const items: NotificationItem[] = [
      baseNotification({
        source: "ALERT",
        priority: "critical",
        status: AlertStatus.OPEN,
        createdAt: now,
        dueAt: null,
      }),
      baseNotification({
        source: "REMINDER",
        priority: "high",
        status: ReminderState.OVERDUE,
        createdAt: thirtyDaysAgo,
        dueAt: thirtyDaysAgo,
      }),
      baseNotification({
        source: "ALERT",
        priority: "medium",
        status: AlertStatus.ACKNOWLEDGED,
        createdAt: now,
        dueAt: null,
      }),
      baseNotification({
        source: "DOCUMENT",
        priority: "medium",
        status: "UNLINKED",
        createdAt: thirtyDaysAgo,
        dueAt: null,
      }),
      baseNotification({
        source: "APPOINTMENT",
        priority: "low",
        status: "UPCOMING",
        createdAt: now,
        dueAt: tomorrow,
      }),
    ];

    expect(getNotificationItemSignal(items[0], now).state).toBe("urgent");
    expect(getNotificationItemSignal(items[1], now).state).toBe("due_now");
    expect(getNotificationItemSignal(items[2], now).state).toBe("follow_up");
    expect(getNotificationItemSignal(items[3], now).state).toBe("stale");
    expect(getNotificationItemSignal(items[4], now).state).toBe("scheduled");

    const summary = buildNotificationReliabilitySummary(items, now);
    expect(summary.urgent).toBe(1);
    expect(summary.dueNow).toBe(1);
    expect(summary.followUp).toBe(1);
    expect(summary.stale).toBe(1);
    expect(summary.scheduled).toBe(1);
    expect(summary.cleanupCandidates).toBeGreaterThanOrEqual(2);
  });

  it("keeps action labels source-specific for notification cards", async () => {
    const { getNotificationActionLabel } =
      await import("@/lib/notification-center");

    expect(
      getNotificationActionLabel(
        baseNotification({ source: "ALERT", status: AlertStatus.OPEN }),
      ),
    ).toBe("Acknowledge or resolve alert");
    expect(
      getNotificationActionLabel(
        baseNotification({ source: "ALERT", status: AlertStatus.ACKNOWLEDGED }),
      ),
    ).toBe("Resolve acknowledged alert");
    expect(
      getNotificationActionLabel(
        baseNotification({ source: "REMINDER", status: ReminderState.OVERDUE }),
      ),
    ).toBe("Complete, snooze, or skip overdue reminder");
    expect(
      getNotificationActionLabel(
        baseNotification({
          source: "DEVICE",
          status: DeviceConnectionStatus.ERROR,
        }),
      ),
    ).toBe("Review device sync health");
  });
});
