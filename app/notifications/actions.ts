"use server";

import { revalidatePath } from "next/cache";
import { AlertStatus, ReminderChannel, ReminderSourceType, ReminderState, ReminderType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { createAlertAuditLog } from "@/lib/alerts/audit";
import { createReminderAuditLog, snoozeReminder, updateReminderState } from "@/lib/reminders/service";

type NotificationSource = "ALERT" | "REMINDER" | "APPOINTMENT" | "LAB" | "DOCUMENT" | "CARE" | "DEVICE";

function requiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length ? value : null;
}

function parseSource(value: string): NotificationSource {
  const normalized = value.toUpperCase();
  if (["ALERT", "REMINDER", "APPOINTMENT", "LAB", "DOCUMENT", "CARE", "DEVICE"].includes(normalized)) {
    return normalized as NotificationSource;
  }
  return "REMINDER";
}

function followUpDueAt() {
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + 1);
  dueAt.setHours(9, 0, 0, 0);
  return dueAt;
}

function revalidateNotificationSurfaces() {
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  revalidatePath("/care-plan");
  revalidatePath("/review-queue");
  revalidatePath("/summary");
}

export async function acknowledgeNotificationAlertAction(formData: FormData) {
  const user = await requireUser();
  const alertId = requiredString(formData, "alertId");
  const now = new Date();

  await db.alertEvent.updateMany({
    where: {
      id: alertId,
      userId: user.id!,
      status: AlertStatus.OPEN,
    },
    data: {
      status: AlertStatus.ACKNOWLEDGED,
      ownerAcknowledgedAt: now,
    },
  });

  await createAlertAuditLog({
    userId: user.id!,
    alertId,
    actorUserId: user.id!,
    action: "notification.alert_acknowledged",
    note: optionalString(formData, "note") ?? "Acknowledged from Notification Center.",
  });

  revalidateNotificationSurfaces();
  revalidatePath("/alerts");
}

export async function resolveNotificationAlertAction(formData: FormData) {
  const user = await requireUser();
  const alertId = requiredString(formData, "alertId");
  const now = new Date();

  await db.alertEvent.updateMany({
    where: {
      id: alertId,
      userId: user.id!,
      status: { in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
    },
    data: {
      status: AlertStatus.RESOLVED,
      resolvedAt: now,
    },
  });

  await createAlertAuditLog({
    userId: user.id!,
    alertId,
    actorUserId: user.id!,
    action: "notification.alert_resolved",
    note: optionalString(formData, "note") ?? "Resolved from Notification Center.",
  });

  revalidateNotificationSurfaces();
  revalidatePath("/alerts");
}

export async function completeNotificationReminderAction(formData: FormData) {
  const user = await requireUser();
  const reminderId = requiredString(formData, "reminderId");

  await updateReminderState({
    userId: user.id!,
    reminderId,
    nextState: ReminderState.COMPLETED,
    actorUserId: user.id!,
    note: "Completed from Notification Center.",
  });

  revalidateNotificationSurfaces();
  revalidatePath("/reminders");
}

export async function skipNotificationReminderAction(formData: FormData) {
  const user = await requireUser();
  const reminderId = requiredString(formData, "reminderId");

  await updateReminderState({
    userId: user.id!,
    reminderId,
    nextState: ReminderState.SKIPPED,
    actorUserId: user.id!,
    note: "Skipped from Notification Center.",
  });

  revalidateNotificationSurfaces();
  revalidatePath("/reminders");
}

export async function snoozeNotificationReminderAction(formData: FormData) {
  const user = await requireUser();
  const reminderId = requiredString(formData, "reminderId");
  const minutesRaw = Number(formData.get("minutes") ?? 60);
  const minutes = Number.isFinite(minutesRaw) ? Math.max(15, minutesRaw) : 60;

  await snoozeReminder({
    userId: user.id!,
    reminderId,
    minutes,
    actorUserId: user.id!,
    note: `Snoozed for ${minutes} minutes from Notification Center.`,
  });

  revalidateNotificationSurfaces();
  revalidatePath("/reminders");
}

export async function createNotificationFollowUpReminderAction(formData: FormData) {
  const user = await requireUser();
  const source = parseSource(requiredString(formData, "source"));
  const sourceId = requiredString(formData, "sourceId");
  const title = requiredString(formData, "title");
  const description = optionalString(formData, "description") ?? "Follow up on this notification.";
  const dedupeKey = `notification-follow-up:${user.id}:${source}:${sourceId}`;

  const reminder = await db.reminder.upsert({
    where: { dedupeKey },
    update: {
      state: ReminderState.DUE,
      dueAt: followUpDueAt(),
      completed: false,
      completedAt: null,
      skippedAt: null,
      missedAt: null,
    },
    create: {
      userId: user.id!,
      type: ReminderType.GENERAL,
      title: `Follow up: ${title}`.slice(0, 180),
      description,
      dueAt: followUpDueAt(),
      completed: false,
      state: ReminderState.DUE,
      channel: ReminderChannel.IN_APP,
      gracePeriodMinutes: 240,
      timezone: "Asia/Manila",
      sourceType: ReminderSourceType.GENERAL,
      sourceId,
      dedupeKey,
    },
    select: { id: true },
  });

  await createReminderAuditLog({
    userId: user.id!,
    reminderId: reminder.id,
    actorUserId: user.id!,
    action: "notification.follow_up_created",
    note: `Created from ${source} notification ${sourceId}.`,
    metadata: { source, sourceId },
  });

  revalidateNotificationSurfaces();
  revalidatePath("/reminders");
}
