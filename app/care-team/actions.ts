"use server";

import { randomUUID } from "crypto";
import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { logAccessAudit } from "@/lib/access";
import { CareAccessRole } from "@prisma/client";

function boolFromForm(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function inviteCareMemberAction(formData: FormData) {
  const actor = await requireUser();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const accessRole = String(formData.get("accessRole") || "CAREGIVER") as CareAccessRole;
  const note = String(formData.get("note") || "").trim() || null;

  if (!email) {
    throw new Error("Email is required.");
  }

  if (email === actor.email?.toLowerCase()) {
    throw new Error("You cannot invite yourself.");
  }

  const invite = await db.careInvite.upsert({
    where: {
      ownerUserId_email: {
        ownerUserId: actor.id,
        email,
      },
    },
    update: {
      accessRole,
      status: "PENDING",
      token: randomUUID(),
      grantedByUserId: actor.id,
      canViewRecords: boolFromForm(formData, "canViewRecords"),
      canEditRecords: boolFromForm(formData, "canEditRecords"),
      canAddNotes: boolFromForm(formData, "canAddNotes"),
      canExport: boolFromForm(formData, "canExport"),
      canGenerateAIInsights: boolFromForm(formData, "canGenerateAIInsights"),
      note,
      expiresAt: addDays(new Date(), 7),
      acceptedAt: null,
    },
    create: {
      ownerUserId: actor.id,
      email,
      accessRole,
      status: "PENDING",
      token: randomUUID(),
      grantedByUserId: actor.id,
      canViewRecords: boolFromForm(formData, "canViewRecords"),
      canEditRecords: boolFromForm(formData, "canEditRecords"),
      canAddNotes: boolFromForm(formData, "canAddNotes"),
      canExport: boolFromForm(formData, "canExport"),
      canGenerateAIInsights: boolFromForm(formData, "canGenerateAIInsights"),
      note,
      expiresAt: addDays(new Date(), 7),
    },
  });

  await logAccessAudit({
    ownerUserId: actor.id,
    actorUserId: actor.id,
    action: "CARE_INVITE_SENT",
    targetType: "CareInvite",
    targetId: invite.id,
    metadata: {
      email,
      accessRole,
    },
  });

  revalidatePath("/care-team");
}

export async function acceptCareInviteAction(formData: FormData) {
  const actor = await requireUser();
  const inviteId = String(formData.get("inviteId") || "").trim();

  if (!inviteId) {
    throw new Error("Invite ID is required.");
  }

  if (!actor.email) {
    throw new Error("Your account must have an email to accept an invite.");
  }

  const invite = await db.careInvite.findFirst({
    where: {
      id: inviteId,
      email: actor.email.toLowerCase(),
      status: "PENDING",
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!invite) {
    throw new Error("Invite not found or expired.");
  }

  const access = await db.careAccess.upsert({
    where: {
      ownerUserId_memberUserId: {
        ownerUserId: invite.ownerUserId,
        memberUserId: actor.id,
      },
    },
    update: {
      accessRole: invite.accessRole,
      status: "ACTIVE",
      canViewRecords: invite.canViewRecords,
      canEditRecords: invite.canEditRecords,
      canAddNotes: invite.canAddNotes,
      canExport: invite.canExport,
      canGenerateAIInsights: invite.canGenerateAIInsights,
      grantedByUserId: invite.grantedByUserId,
      note: invite.note,
    },
    create: {
      ownerUserId: invite.ownerUserId,
      memberUserId: actor.id,
      accessRole: invite.accessRole,
      status: "ACTIVE",
      canViewRecords: invite.canViewRecords,
      canEditRecords: invite.canEditRecords,
      canAddNotes: invite.canAddNotes,
      canExport: invite.canExport,
      canGenerateAIInsights: invite.canGenerateAIInsights,
      grantedByUserId: invite.grantedByUserId,
      note: invite.note,
    },
  });

  await db.careInvite.update({
    where: { id: invite.id },
    data: {
      status: "ACTIVE",
      acceptedAt: new Date(),
    },
  });

  await logAccessAudit({
    ownerUserId: invite.ownerUserId,
    actorUserId: actor.id,
    action: "CARE_INVITE_ACCEPTED",
    targetType: "CareAccess",
    targetId: access.id,
    metadata: {
      accessRole: access.accessRole,
    },
  });

  revalidatePath("/care-team");
}

export async function declineCareInviteAction(formData: FormData) {
  const actor = await requireUser();
  const inviteId = String(formData.get("inviteId") || "").trim();

  if (!inviteId) {
    throw new Error("Invite ID is required.");
  }

  if (!actor.email) {
    throw new Error("Your account must have an email to decline an invite.");
  }

  const invite = await db.careInvite.findFirst({
    where: {
      id: inviteId,
      email: actor.email.toLowerCase(),
      status: "PENDING",
    },
  });

  if (!invite) {
    throw new Error("Invite not found.");
  }

  await db.careInvite.update({
    where: { id: invite.id },
    data: {
      status: "DECLINED",
    },
  });

  await logAccessAudit({
    ownerUserId: invite.ownerUserId,
    actorUserId: actor.id,
    action: "CARE_INVITE_DECLINED",
    targetType: "CareInvite",
    targetId: invite.id,
  });

  revalidatePath("/care-team");
}

export async function revokeCareAccessAction(formData: FormData) {
  const actor = await requireUser();
  const accessId = String(formData.get("accessId") || "").trim();

  if (!accessId) {
    throw new Error("Access ID is required.");
  }

  const access = await db.careAccess.findFirst({
    where: {
      id: accessId,
      ownerUserId: actor.id,
    },
  });

  if (!access) {
    throw new Error("Access record not found.");
  }

  await db.careAccess.update({
    where: { id: access.id },
    data: {
      status: "REVOKED",
    },
  });

  await logAccessAudit({
    ownerUserId: actor.id,
    actorUserId: actor.id,
    action: "CARE_ACCESS_REVOKED",
    targetType: "CareAccess",
    targetId: access.id,
    metadata: {
      memberUserId: access.memberUserId,
    },
  });

  revalidatePath("/care-team");
  revalidatePath(`/patient/${actor.id}`);
}

export async function updateCareAccessPermissionsAction(formData: FormData) {
  const actor = await requireUser();
  const accessId = String(formData.get("accessId") || "").trim();

  if (!accessId) {
    throw new Error("Access ID is required.");
  }

  const access = await db.careAccess.findFirst({
    where: {
      id: accessId,
      ownerUserId: actor.id,
    },
  });

  if (!access) {
    throw new Error("Access record not found.");
  }

  await db.careAccess.update({
    where: { id: access.id },
    data: {
      canViewRecords: boolFromForm(formData, "canViewRecords"),
      canEditRecords: boolFromForm(formData, "canEditRecords"),
      canAddNotes: boolFromForm(formData, "canAddNotes"),
      canExport: boolFromForm(formData, "canExport"),
      canGenerateAIInsights: boolFromForm(formData, "canGenerateAIInsights"),
      note: String(formData.get("note") || "").trim() || null,
    },
  });

  await logAccessAudit({
    ownerUserId: actor.id,
    actorUserId: actor.id,
    action: "CARE_ACCESS_UPDATED",
    targetType: "CareAccess",
    targetId: access.id,
  });

  revalidatePath("/care-team");
}