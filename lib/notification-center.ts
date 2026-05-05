import {
  AlertSeverity,
  AlertStatus,
  AppointmentStatus,
  CareAccessStatus,
  DeviceConnectionStatus,
  LabFlag,
  ReminderState,
} from "@prisma/client";
import { db } from "@/lib/db";

export type NotificationPriority = "critical" | "high" | "medium" | "low";
export type NotificationTone = "danger" | "warning" | "info" | "success" | "neutral";
export type NotificationSource =
  | "ALERT"
  | "REMINDER"
  | "APPOINTMENT"
  | "LAB"
  | "DOCUMENT"
  | "CARE"
  | "DEVICE";

export type NotificationItem = {
  id: string;
  source: NotificationSource;
  title: string;
  description: string;
  priority: NotificationPriority;
  tone: NotificationTone;
  href: string;
  createdAt: Date;
  dueAt?: Date | null;
  status: string;
  meta: string;
  sourceId: string;
  actionHint: string;
};

export type NotificationCenterFilters = {
  source?: string;
  priority?: string;
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function priorityScore(priority: NotificationPriority) {
  if (priority === "critical") return 4;
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

function alertPriority(severity: AlertSeverity): NotificationPriority {
  if (severity === AlertSeverity.CRITICAL) return "critical";
  if (severity === AlertSeverity.HIGH) return "high";
  if (severity === AlertSeverity.MEDIUM) return "medium";
  return "low";
}

function alertTone(severity: AlertSeverity): NotificationTone {
  if (severity === AlertSeverity.CRITICAL || severity === AlertSeverity.HIGH) return "danger";
  if (severity === AlertSeverity.MEDIUM) return "warning";
  return "info";
}

function reminderPriority(state: ReminderState, dueAt: Date): NotificationPriority {
  if (state === ReminderState.OVERDUE || dueAt.getTime() < Date.now()) return "high";
  if (dueAt.getTime() - Date.now() <= 4 * 60 * 60 * 1000) return "medium";
  return "low";
}

function labPriority(flag: LabFlag): NotificationPriority {
  if (flag === LabFlag.HIGH || flag === LabFlag.LOW) return "high";
  if (flag === LabFlag.BORDERLINE) return "medium";
  return "low";
}

function labTone(flag: LabFlag): NotificationTone {
  if (flag === LabFlag.HIGH || flag === LabFlag.LOW) return "danger";
  if (flag === LabFlag.BORDERLINE) return "warning";
  return "success";
}

function matchesFilter(item: NotificationItem, filters: NotificationCenterFilters) {
  const source = filters.source && filters.source !== "ALL" ? filters.source : undefined;
  const priority = filters.priority && filters.priority !== "ALL" ? filters.priority : undefined;

  if (source && item.source !== source) return false;
  if (priority && item.priority !== priority) return false;
  return true;
}

export async function getNotificationCenterData(userId: string, filters: NotificationCenterFilters = {}) {
  const now = new Date();
  const today = startOfToday();
  const soon = addDays(now, 14);
  const staleDeviceCutoff = addDays(now, -7);

  const [alerts, reminders, appointments, labs, documents, careInvites, deviceConnections] = await Promise.all([
    db.alertEvent.findMany({
      where: { userId, status: { in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        message: true,
        severity: true,
        status: true,
        category: true,
        createdAt: true,
      },
    }),
    db.reminder.findMany({
      where: {
        userId,
        state: { in: [ReminderState.DUE, ReminderState.SENT, ReminderState.OVERDUE, ReminderState.MISSED] },
        dueAt: { lte: soon },
      },
      orderBy: { dueAt: "asc" },
      take: 20,
      select: {
        id: true,
        title: true,
        description: true,
        state: true,
        type: true,
        dueAt: true,
        createdAt: true,
      },
    }),
    db.appointment.findMany({
      where: {
        userId,
        status: AppointmentStatus.UPCOMING,
        scheduledAt: { gte: today, lte: soon },
      },
      orderBy: { scheduledAt: "asc" },
      take: 12,
      select: {
        id: true,
        purpose: true,
        doctorName: true,
        clinic: true,
        scheduledAt: true,
        createdAt: true,
      },
    }),
    db.labResult.findMany({
      where: { userId, flag: { in: [LabFlag.BORDERLINE, LabFlag.HIGH, LabFlag.LOW] } },
      orderBy: { dateTaken: "desc" },
      take: 12,
      select: {
        id: true,
        testName: true,
        resultSummary: true,
        flag: true,
        dateTaken: true,
        createdAt: true,
      },
    }),
    db.medicalDocument.findMany({
      where: {
        userId,
        OR: [{ linkedRecordType: null }, { notes: null }, { notes: "" }],
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        type: true,
        fileName: true,
        linkedRecordType: true,
        notes: true,
        createdAt: true,
      },
    }),
    db.careInvite.findMany({
      where: { ownerUserId: userId, status: CareAccessStatus.PENDING },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        email: true,
        accessRole: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
    db.deviceConnection.findMany({
      where: {
        userId,
        OR: [
          { status: DeviceConnectionStatus.ERROR },
          { status: DeviceConnectionStatus.DISCONNECTED },
          { lastError: { not: null } },
          { lastSyncedAt: { lt: staleDeviceCutoff } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: {
        id: true,
        source: true,
        platform: true,
        deviceLabel: true,
        status: true,
        lastSyncedAt: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const items: NotificationItem[] = [
    ...alerts.map((alert) => ({
      id: `alert-${alert.id}`,
      sourceId: alert.id,
      source: "ALERT" as const,
      title: alert.title,
      description: alert.message,
      priority: alertPriority(alert.severity),
      tone: alertTone(alert.severity),
      href: `/alerts?status=${alert.status}&severity=${alert.severity}`,
      createdAt: alert.createdAt,
      status: alert.status,
      meta: `${alert.category} • ${alert.severity}`,
      actionHint: alert.status === AlertStatus.OPEN ? "Acknowledge or resolve this alert." : "Resolve this acknowledged alert.",
    })),
    ...reminders.map((reminder) => ({
      id: `reminder-${reminder.id}`,
      sourceId: reminder.id,
      source: "REMINDER" as const,
      title: reminder.title,
      description: reminder.description || `${reminder.type} reminder due ${reminder.dueAt.toLocaleString()}`,
      priority: reminderPriority(reminder.state, reminder.dueAt),
      tone: reminder.state === ReminderState.OVERDUE || reminder.dueAt.getTime() < Date.now() ? "warning" as const : "info" as const,
      href: `/reminders?state=${reminder.state}`,
      createdAt: reminder.createdAt,
      dueAt: reminder.dueAt,
      status: reminder.state,
      meta: reminder.type,
      actionHint: "Complete, skip, or snooze this reminder.",
    })),
    ...appointments.map((appointment) => ({
      id: `appointment-${appointment.id}`,
      sourceId: appointment.id,
      source: "APPOINTMENT" as const,
      title: appointment.purpose,
      description: `${appointment.doctorName} • ${appointment.clinic}`,
      priority: appointment.scheduledAt.getTime() - now.getTime() <= 3 * 24 * 60 * 60 * 1000 ? "medium" as const : "low" as const,
      tone: "info" as const,
      href: "/appointments",
      createdAt: appointment.createdAt,
      dueAt: appointment.scheduledAt,
      status: "UPCOMING",
      meta: "Upcoming visit",
      actionHint: "Open the appointment or create a prep reminder.",
    })),
    ...labs.map((lab) => ({
      id: `lab-${lab.id}`,
      sourceId: lab.id,
      source: "LAB" as const,
      title: lab.testName,
      description: lab.resultSummary,
      priority: labPriority(lab.flag),
      tone: labTone(lab.flag),
      href: "/labs",
      createdAt: lab.createdAt,
      dueAt: lab.dateTaken,
      status: lab.flag,
      meta: "Lab follow-up",
      actionHint: "Open lab review or create a follow-up reminder.",
    })),
    ...documents.map((document) => {
      const needsLink = !document.linkedRecordType;
      const needsNotes = !document.notes;
      return {
        id: `document-${document.id}`,
        sourceId: document.id,
        source: "DOCUMENT" as const,
        title: document.title,
        description: needsLink
          ? `${document.fileName} is not linked to a record yet.`
          : `${document.fileName} needs stronger review notes.`,
        priority: needsLink ? "medium" as const : "low" as const,
        tone: needsLink ? "warning" as const : "neutral" as const,
        href: needsLink ? "/documents?link=UNLINKED" : "/documents?quality=NEEDS_NOTES",
        createdAt: document.createdAt,
        status: needsLink ? "UNLINKED" : needsNotes ? "NEEDS_NOTES" : "READY",
        meta: document.type,
        actionHint: needsLink ? "Open document hub and link this file." : "Open document hub and add notes.",
      };
    }),
    ...careInvites.map((invite) => ({
      id: `care-${invite.id}`,
      sourceId: invite.id,
      source: "CARE" as const,
      title: `Pending invite for ${invite.email}`,
      description: `${invite.accessRole} access expires ${invite.expiresAt.toLocaleDateString()}`,
      priority: invite.expiresAt.getTime() - now.getTime() <= 3 * 24 * 60 * 60 * 1000 ? "medium" as const : "low" as const,
      tone: "info" as const,
      href: "/care-team",
      createdAt: invite.createdAt,
      dueAt: invite.expiresAt,
      status: invite.status,
      meta: invite.accessRole,
      actionHint: "Open care-team invite management.",
    })),
    ...deviceConnections.map((device) => ({
      id: `device-${device.id}`,
      sourceId: device.id,
      source: "DEVICE" as const,
      title: device.deviceLabel || `${device.platform} ${device.source}`,
      description: device.lastError || `Last synced ${device.lastSyncedAt ? device.lastSyncedAt.toLocaleDateString() : "never"}`,
      priority: device.status === DeviceConnectionStatus.ERROR ? "high" as const : "medium" as const,
      tone: device.status === DeviceConnectionStatus.ERROR ? "danger" as const : "warning" as const,
      href: "/device-connection",
      createdAt: device.updatedAt || device.createdAt,
      dueAt: device.lastSyncedAt,
      status: device.status,
      meta: `${device.source} • ${device.platform}`,
      actionHint: "Open device connection review or create a sync follow-up reminder.",
    })),
  ];

  const sortedItems = items
    .sort((a, b) => {
      const score = priorityScore(b.priority) - priorityScore(a.priority);
      if (score !== 0) return score;
      const aTime = (a.dueAt || a.createdAt).getTime();
      const bTime = (b.dueAt || b.createdAt).getTime();
      return bTime - aTime;
    });

  const filteredItems = sortedItems.filter((item) => matchesFilter(item, filters));

  const counts = {
    total: sortedItems.length,
    visible: filteredItems.length,
    critical: sortedItems.filter((item) => item.priority === "critical").length,
    high: sortedItems.filter((item) => item.priority === "high").length,
    medium: sortedItems.filter((item) => item.priority === "medium").length,
    low: sortedItems.filter((item) => item.priority === "low").length,
    bySource: (['ALERT', 'REMINDER', 'APPOINTMENT', 'LAB', 'DOCUMENT', 'CARE', 'DEVICE'] as NotificationSource[]).map((source) => ({
      source,
      count: sortedItems.filter((item) => item.source === source).length,
    })),
  };

  const nextActions = [
    counts.critical || counts.high ? "Review high-priority alerts, abnormal labs, or device errors first." : "No high-risk items are waiting right now.",
    counts.bySource.find((item) => item.source === "REMINDER")?.count ? "Clear due and overdue reminders to keep the care plan current." : "Reminder queue is clear for the current filter window.",
    counts.bySource.find((item) => item.source === "DOCUMENT")?.count ? "Link uploaded documents to records so future summaries are more complete." : "Document hygiene looks good for now.",
  ];

  return {
    items: filteredItems,
    allItems: sortedItems,
    counts,
    nextActions,
  };
}
