"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { generateReminderInstances, snoozeReminder, updateReminderState } from "@/lib/reminders/service";

function refreshReminderScreens() {
  revalidatePath("/reminders");
  revalidatePath("/dashboard");
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

  refreshReminderScreens();
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

  refreshReminderScreens();
}

export async function snoozeReminderAction(formData: FormData) {
  const user = await requireUser();
  const reminderId = String(formData.get("reminderId") || "");
  const minutes = Number(formData.get("minutes") || 15);

  await snoozeReminder({
    userId: user.id!,
    reminderId,
    minutes,
    actorUserId: user.id!,
  });

  refreshReminderScreens();
}

export async function regenerateReminderAction() {
  const user = await requireUser();

  await generateReminderInstances({
    userId: user.id!,
    requestedByUserId: user.id!,
  });

  refreshReminderScreens();
}
