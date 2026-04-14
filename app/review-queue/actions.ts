"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

function requiredString(formData: FormData, field: string, label: string) {
  const value = String(formData.get(field) || "").trim();
  if (!value) throw new Error(`${label} is required.`);
  return value;
}

function optionalString(formData: FormData, field: string) {
  const value = String(formData.get(field) || "").trim();
  return value || null;
}

function reviewStamp(actorLabel: string, note: string) {
  return `[Review note • ${new Date().toLocaleString("en-PH", { hour12: true })} • ${actorLabel}]\n${note}`;
}

export async function addReminderReviewNoteAction(formData: FormData) {
  const user = await requireUser();
  const reminderId = requiredString(formData, "reminderId", "Reminder id");
  const note = requiredString(formData, "note", "Follow-up note");

  const reminder = await db.reminder.findFirst({
    where: { id: reminderId, userId: user.id! },
    select: { id: true },
  });

  if (!reminder) throw new Error("Reminder not found.");

  await db.reminderAuditLog.create({
    data: {
      userId: user.id!,
      reminderId: reminder.id,
      actorUserId: user.id!,
      action: "review.note",
      note,
      metadataJson: JSON.stringify({ source: "review_queue" }),
    },
  });

  revalidatePath("/review-queue");
  revalidatePath("/reminders");
  revalidatePath("/dashboard");
}

export async function addSymptomReviewNoteAction(formData: FormData) {
  const user = await requireUser();
  const symptomId = requiredString(formData, "symptomId", "Symptom id");
  const note = requiredString(formData, "note", "Follow-up note");

  const symptom = await db.symptomEntry.findFirst({
    where: { id: symptomId, userId: user.id! },
    select: { id: true, notes: true },
  });

  if (!symptom) throw new Error("Symptom not found.");

  const actorLabel = user.name || user.email || "Care team";
  const stamped = reviewStamp(actorLabel, note);
  const nextNotes = symptom.notes ? `${symptom.notes}\n\n${stamped}` : stamped;

  await db.symptomEntry.update({
    where: { id: symptom.id },
    data: { notes: nextNotes },
  });

  revalidatePath("/review-queue");
  revalidatePath("/symptoms");
  revalidatePath("/dashboard");
}

export async function addAppointmentFollowUpDraftAction(formData: FormData) {
  const user = await requireUser();
  const title = requiredString(formData, "title", "Title");
  const note = optionalString(formData, "note");

  await db.appointment.create({
    data: {
      userId: user.id!,
      clinic: "TBD",
      doctorName: "Follow-up needed",
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      purpose: title,
      notes: note,
      followUpNotes: "Created from review queue draft.",
      status: "UPCOMING",
    },
  });

  revalidatePath("/review-queue");
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
}
