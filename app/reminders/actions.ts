"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import {
  generateReminderInstances,
  snoozeReminder,
  updateReminderState,
} from "@/lib/reminders/service";

function revalidateReminderSurfaces() {
  revalidatePath("/reminders");
  revalidatePath("/dashboard");
  revalidatePath("/review-queue");
  revalidatePath("/timeline");
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
  const snoozeMinutesRaw = Number(formData.get("snoozeMinutes") || 15);
  const snoozeMinutes = Number.isFinite(snoozeMinutesRaw)
    ? Math.max(5, Math.min(240, snoozeMinutesRaw))
    : 15;

  await snoozeReminder({
    userId: user.id!,
    reminderId,
    snoozeMinutes,
    actorUserId: user.id!,
  });

  revalidateReminderSurfaces();
}

export async function regenerateReminderAction(formData: FormData) {
  const user = await requireUser();
  const targetDateRaw = String(formData.get("targetDate") || "");
  const targetDate = targetDateRaw ? new Date(targetDateRaw) : new Date();

  await generateReminderInstances({
    userId: user.id!,
    targetDate: Number.isNaN(targetDate.getTime()) ? new Date() : targetDate,
    requestedByUserId: user.id!,
  });

  revalidateReminderSurfaces();
}
