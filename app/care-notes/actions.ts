"use server";

import { CareNoteCategory, CareNotePriority, CareNoteVisibility } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { logAccessAudit, requireOwnerAccess } from "@/lib/access";

function requiredText(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) || "").trim();
  if (!value) throw new Error(`${label} is required.`);
  return value;
}

function enumValue<T extends Record<string, string>>(source: T, raw: FormDataEntryValue | null, fallback: T[keyof T]) {
  const value = String(raw || "").trim();
  return Object.values(source).includes(value as T[keyof T]) ? (value as T[keyof T]) : fallback;
}

export async function createCareNoteAction(formData: FormData) {
  const actor = await requireUser();
  const ownerUserId = requiredText(formData, "ownerUserId", "Patient");
  const title = requiredText(formData, "title", "Title").slice(0, 160);
  const body = requiredText(formData, "body", "Note").slice(0, 4000);
  const category = enumValue(CareNoteCategory, formData.get("category"), CareNoteCategory.GENERAL);
  const priority = enumValue(CareNotePriority, formData.get("priority"), CareNotePriority.NORMAL);
  const visibility = enumValue(CareNoteVisibility, formData.get("visibility"), CareNoteVisibility.CARE_TEAM);
  const pinned = formData.get("pinned") === "on";

  await requireOwnerAccess(actor.id, ownerUserId, "notes");

  const note = await db.careNote.create({
    data: {
      ownerUserId,
      authorUserId: actor.id,
      title,
      body,
      category,
      priority,
      visibility,
      pinned,
    },
  });

  await logAccessAudit({
    ownerUserId,
    actorUserId: actor.id,
    action: "CARE_NOTE_CREATED",
    targetType: "CareNote",
    targetId: note.id,
    metadata: { category, priority, visibility, pinned },
  });

  revalidatePath("/care-notes");
  revalidatePath("/care-team");
  revalidatePath(`/patient/${ownerUserId}`);
}

export async function toggleCareNotePinAction(formData: FormData) {
  const actor = await requireUser();
  const noteId = requiredText(formData, "noteId", "Note");

  const note = await db.careNote.findUnique({ where: { id: noteId } });
  if (!note) throw new Error("Care note not found.");

  await requireOwnerAccess(actor.id, note.ownerUserId, "notes");

  const updated = await db.careNote.update({
    where: { id: note.id },
    data: { pinned: !note.pinned },
  });

  await logAccessAudit({
    ownerUserId: note.ownerUserId,
    actorUserId: actor.id,
    action: updated.pinned ? "CARE_NOTE_PINNED" : "CARE_NOTE_UNPINNED",
    targetType: "CareNote",
    targetId: note.id,
    metadata: { title: note.title },
  });

  revalidatePath("/care-notes");
  revalidatePath(`/patient/${note.ownerUserId}`);
}

export async function archiveCareNoteAction(formData: FormData) {
  const actor = await requireUser();
  const noteId = requiredText(formData, "noteId", "Note");

  const note = await db.careNote.findUnique({ where: { id: noteId } });
  if (!note) throw new Error("Care note not found.");

  await requireOwnerAccess(actor.id, note.ownerUserId, "notes");

  await db.careNote.update({
    where: { id: note.id },
    data: { archivedAt: new Date(), pinned: false },
  });

  await logAccessAudit({
    ownerUserId: note.ownerUserId,
    actorUserId: actor.id,
    action: "CARE_NOTE_ARCHIVED",
    targetType: "CareNote",
    targetId: note.id,
    metadata: { title: note.title },
  });

  revalidatePath("/care-notes");
  revalidatePath(`/patient/${note.ownerUserId}`);
}
