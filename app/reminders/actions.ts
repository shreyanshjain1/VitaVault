"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
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
