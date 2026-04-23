"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { createReminderAuditLog } from "@/lib/reminders/service";
import { outboundEmailEnabled, sendReminderEmail } from "@/lib/outbound-email";
import {
  generateReminderInstances,
  markDueRemindersAsOverdue,
  snoozeReminder,
  updateReminderSchedule,
  updateReminderState,
} from "@/lib/reminders/service";

function parsePositiveInt(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseOptionalString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length ? normalized : null;
}

function revalidateReminderSurfaces() {
  revalidatePath("/reminders");
  revalidatePath("/dashboard");
  revalidatePath("/review-queue");
  revalidatePath("/summary");
}

export async function completeReminderAction(formData: FormData) {
  const user = await requireUser();
  const reminderId = String(formData.get("reminderId") || "");

  await updateReminderState({
    userId: user.id!,
    reminderId,
    nextState: "COMPLETED",
    actorUserId: user.id!,
  });

  revalidateReminderSurfaces();
}

export async function skipReminderAction(formData: FormData) {
  const user = await requireUser();
  const reminderId = String(formData.get("reminderId") || "");

  await updateReminderState({
    userId: user.id!,
    reminderId,
    nextState: "SKIPPED",
    actorUserId: user.id!,
  });

  revalidateReminderSurfaces();
}

export async function snoozeReminderAction(formData: FormData) {
  const user = await requireUser();
  const reminderId = String(formData.get("reminderId") || "");
  const minutes = parsePositiveInt(formData.get("snoozeMinutes"), 15);

  await snoozeReminder({
    userId: user.id!,
    reminderId,
    minutes,
    actorUserId: user.id!,
    note: `Snoozed for ${minutes} minute${minutes === 1 ? "" : "s"}.`,
  });

  revalidateReminderSurfaces();
}

export async function regenerateRemindersAction(formData: FormData) {
  const user = await requireUser();
  const targetDateRaw = String(formData.get("targetDate") || "").trim();
  const targetDate = targetDateRaw ? new Date(`${targetDateRaw}T00:00:00`) : new Date();

  await generateReminderInstances({
    userId: user.id!,
    targetDate,
    requestedByUserId: user.id!,
  });

  await markDueRemindersAsOverdue({
    userId: user.id!,
    requestedByUserId: user.id!,
  });

  revalidateReminderSurfaces();
}

export async function updateReminderScheduleAction(formData: FormData) {
  const user = await requireUser();
  const reminderId = String(formData.get("reminderId") || "").trim();
  const dueDate = String(formData.get("dueDate") || "").trim();
  const dueTime = String(formData.get("dueTime") || "").trim();

  if (!dueDate || !dueTime) {
    throw new Error("Both due date and due time are required.");
  }

  const dueAt = new Date(`${dueDate}T${dueTime}:00`);

  if (Number.isNaN(dueAt.getTime())) {
    throw new Error("Invalid due date or time.");
  }

  const gracePeriodMinutes = parsePositiveInt(formData.get("gracePeriodMinutes"), 60);

  await updateReminderSchedule({
    userId: user.id!,
    reminderId,
    actorUserId: user.id!,
    dueAt,
    gracePeriodMinutes,
    channel: parseOptionalString(formData.get("channel")) ?? undefined,
    timezone: parseOptionalString(formData.get("timezone")) ?? undefined,
    quietHoursStart: parseOptionalString(formData.get("quietHoursStart")) ?? undefined,
    quietHoursEnd: parseOptionalString(formData.get("quietHoursEnd")) ?? undefined,
  });

  revalidateReminderSurfaces();
}

export async function sendReminderEmailAction(formData: FormData) {
  const user = await requireUser();
  const reminderId = String(formData.get("reminderId") || "").trim();

  if (!user.email) {
    throw new Error("Your account must have an email address to receive reminder emails.");
  }

  const reminder = await db.reminder.findFirst({
    where: {
      id: reminderId,
      userId: user.id!,
    },
    select: {
      id: true,
      title: true,
      description: true,
      dueAt: true,
      state: true,
      timezone: true,
      gracePeriodMinutes: true,
    },
  });

  if (!reminder) {
    throw new Error("Reminder not found.");
  }

  if (!outboundEmailEnabled()) {
    throw new Error("Email delivery is not configured.");
  }

  await sendReminderEmail({
    to: user.email,
    patientName: user.name || user.email,
    reminder,
  });

  await db.reminder.update({
    where: { id: reminder.id },
    data: {
      channel: "EMAIL",
      state: reminder.state === "DUE" ? "SENT" : reminder.state,
      sentAt: new Date(),
    },
  });

  await createReminderAuditLog({
    userId: user.id!,
    actorUserId: user.id!,
    reminderId: reminder.id,
    action: "reminder.email_sent",
    metadata: { manualSend: true },
  });

  revalidateReminderSurfaces();
}

export async function sendDueReminderDigestAction() {
  const user = await requireUser();

  if (!user.email) {
    throw new Error("Your account must have an email address to receive reminder emails.");
  }

  if (!outboundEmailEnabled()) {
    throw new Error("Email delivery is not configured.");
  }

  const reminders = await db.reminder.findMany({
    where: {
      userId: user.id!,
      state: { in: ["DUE", "OVERDUE"] },
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    take: 5,
    select: {
      id: true,
      title: true,
      description: true,
      dueAt: true,
      state: true,
      timezone: true,
      gracePeriodMinutes: true,
    },
  });

  if (!reminders.length) {
    throw new Error("No due or overdue reminders found.");
  }

  for (const reminder of reminders) {
    await sendReminderEmail({
      to: user.email,
      patientName: user.name || user.email,
      reminder,
    });

    await db.reminder.update({
      where: { id: reminder.id },
      data: {
        channel: "EMAIL",
        state: reminder.state === "DUE" ? "SENT" : reminder.state,
        sentAt: new Date(),
      },
    });

    await createReminderAuditLog({
      userId: user.id!,
      actorUserId: user.id!,
      reminderId: reminder.id,
      action: "reminder.email_sent",
      metadata: { manualSend: false, batchSend: true },
    });
  }

  revalidateReminderSurfaces();
}
