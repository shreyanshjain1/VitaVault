"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { updateReminderState } from "@/lib/reminders/service";

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
}