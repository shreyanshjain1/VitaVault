import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AlertSeverity,
  AlertStatus,
  CareAccessStatus,
  DeviceConnectionStatus,
  LabFlag,
  ReminderState,
} from "@prisma/client";

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

    const { getNotificationCenterData } = await import("@/lib/notification-center");
    const allData = await getNotificationCenterData("user_1");
    const alertOnly = await getNotificationCenterData("user_1", { source: "ALERT" });
    const highOnly = await getNotificationCenterData("user_1", { priority: "high" });

    expect(allData.counts.total).toBe(7);
    expect(allData.counts.critical).toBe(1);
    expect(allData.counts.high).toBeGreaterThanOrEqual(3);
    expect(allData.items[0]?.priority).toBe("critical");
    expect(alertOnly.items).toHaveLength(1);
    expect(alertOnly.items[0]?.source).toBe("ALERT");
    expect(highOnly.items.every((item) => item.priority === "high")).toBe(true);
    expect(allData.counts.bySource.find((item) => item.source === "DEVICE")?.count).toBe(1);
    expect(allData.nextActions).toContain("Review high-priority alerts, abnormal labs, or device errors first.");
  });
});
