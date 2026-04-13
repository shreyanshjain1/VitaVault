"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import {
  generateReminderInstances,
  markDueRemindersAsOverdue,
  updateReminderState,
  snoozeReminder,
} from "@/lib/reminders/service";

function parsePositiveInt(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
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

  revalidatePath("/reminders");
  revalidatePath("/dashboard");
  revalidatePath("/review-queue");
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

  revalidatePath("/reminders");
  revalidatePath("/dashboard");
  revalidatePath("/review-queue");
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

  revalidatePath("/reminders");
  revalidatePath("/dashboard");
  revalidatePath("/review-queue");
}

export async function regenerateRemindersAction() {
  const user = await requireUser();

  await generateReminderInstances({
    userId: user.id!,
    requestedByUserId: user.id!,
  });

  await markDueRemindersAsOverdue({
    userId: user.id!,
    requestedByUserId: user.id!,
  });

  revalidatePath("/reminders");
  revalidatePath("/dashboard");
  revalidatePath("/review-queue");
}
