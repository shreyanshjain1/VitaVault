"use server";

import { revalidatePath } from "next/cache";
import { AppRole } from "@prisma/client";

import { isEmailDeliveryConfigured, sendEmailVerificationEmail } from "@/lib/account-email";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

function formString(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

async function requireAdminActor() {
  const actor = await requireUser();
  if (actor.role !== AppRole.ADMIN) {
    throw new Error("Only administrators can perform this action.");
  }
  return actor;
}

async function writeAdminAuditLog(args: {
  ownerUserId: string;
  actorUserId: string;
  action: string;
  note?: string | null;
  targetType?: string;
  targetId?: string;
}) {
  await db.accessAuditLog.create({
    data: {
      ownerUserId: args.ownerUserId,
      actorUserId: args.actorUserId,
      action: args.action,
      targetType: args.targetType ?? "USER",
      targetId: args.targetId ?? args.ownerUserId,
      metadataJson: args.note ?? null,
    },
  });
}

async function revokeMobileSessionsForUser(userId: string) {
  return db.mobileSessionToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function deactivateUserAction(formData: FormData) {
  const actor = await requireAdminActor();
  const userId = formString(formData, "userId");
  const reason = formString(formData, "reason");

  if (!userId) throw new Error("User id is required.");
  if (userId === actor.id) throw new Error("You cannot deactivate your own admin account.");

  const target = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      deactivatedAt: true,
    },
  });

  if (!target) throw new Error("User not found.");
  if (target.deactivatedAt) throw new Error("User is already deactivated.");

  await db.user.update({
    where: { id: userId },
    data: {
      deactivatedAt: new Date(),
      deactivatedReason: reason || "Deactivated by administrator.",
    },
  });

  const revoked = await revokeMobileSessionsForUser(userId);

  await writeAdminAuditLog({
    ownerUserId: target.id,
    actorUserId: actor.id,
    action: "ADMIN_DEACTIVATED_USER",
    note: `Deactivated ${target.email}. Reason: ${reason || "No reason provided"}. Revoked ${revoked.count} mobile/API session(s).`,
  });

  revalidatePath("/admin");
  revalidatePath("/security");
}

export async function reactivateUserAction(formData: FormData) {
  const actor = await requireAdminActor();
  const userId = formString(formData, "userId");

  if (!userId) throw new Error("User id is required.");

  const target = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      deactivatedAt: true,
    },
  });

  if (!target) throw new Error("User not found.");
  if (!target.deactivatedAt) throw new Error("User is already active.");

  await db.user.update({
    where: { id: userId },
    data: {
      deactivatedAt: null,
      deactivatedReason: null,
    },
  });

  await writeAdminAuditLog({
    ownerUserId: target.id,
    actorUserId: actor.id,
    action: "ADMIN_REACTIVATED_USER",
    note: `Reactivated ${target.email}.`,
  });

  revalidatePath("/admin");
  revalidatePath("/security");
}

export async function resendVerificationForUserAction(formData: FormData) {
  const actor = await requireAdminActor();
  const userId = formString(formData, "userId");
  if (!userId) throw new Error("User id is required.");

  if (!isEmailDeliveryConfigured()) {
    throw new Error("Email delivery is not configured yet.");
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      deactivatedAt: true,
    },
  });

  if (!target) throw new Error("User not found.");
  if (target.deactivatedAt) throw new Error("Reactivate the user before resending verification.");
  if (target.emailVerified) throw new Error("User is already verified.");

  await sendEmailVerificationEmail({
    userId: target.id,
    email: target.email,
    name: target.name,
  });

  await writeAdminAuditLog({
    ownerUserId: target.id,
    actorUserId: actor.id,
    action: "ADMIN_RESENT_VERIFICATION",
    note: `Verification email resent to ${target.email}`,
  });

  revalidatePath("/admin");
}

export async function revokeUserMobileSessionsAction(formData: FormData) {
  const actor = await requireAdminActor();
  const userId = formString(formData, "userId");
  if (!userId) throw new Error("User id is required.");

  const target = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!target) throw new Error("User not found.");

  const result = await revokeMobileSessionsForUser(userId);

  await writeAdminAuditLog({
    ownerUserId: userId,
    actorUserId: actor.id,
    action: "ADMIN_REVOKED_MOBILE_SESSIONS",
    note: `Revoked ${result.count} mobile/API session(s) for ${target.email}.`,
  });

  revalidatePath("/admin");
  revalidatePath("/security");
}
