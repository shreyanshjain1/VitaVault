"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { AppRole } from "@prisma/client";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { isEmailDeliveryConfigured, sendEmailVerificationEmail } from "@/lib/account-email";

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

const moderateUserSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().trim().max(300).optional(),
});

export async function deactivateUserAction(formData: FormData) {
  const actor = await requireAdminActor();
  const parsed = moderateUserSchema.safeParse({
    userId: formString(formData, "userId"),
    reason: formString(formData, "reason") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid user moderation request.");
  }

  if (parsed.data.userId === actor.id) {
    throw new Error("You cannot deactivate your own administrator account.");
  }

  const target = await db.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, deactivatedAt: true },
  });

  if (!target) throw new Error("User not found.");
  if (target.deactivatedAt) throw new Error("User is already deactivated.");

  const now = new Date();
  await db.$transaction([
    db.user.update({
      where: { id: parsed.data.userId },
      data: {
        deactivatedAt: now,
        deactivatedReason: parsed.data.reason || "Deactivated by admin.",
      },
    }),
    db.session.deleteMany({ where: { userId: parsed.data.userId } }),
    db.mobileSessionToken.updateMany({
      where: { userId: parsed.data.userId, revokedAt: null },
      data: { revokedAt: now },
    }),
    db.accessAuditLog.create({
      data: {
        ownerUserId: parsed.data.userId,
        actorUserId: actor.id!,
        action: "ADMIN_USER_DEACTIVATED",
        targetType: "USER",
        targetId: parsed.data.userId,
        metadataJson: parsed.data.reason || "Deactivated by admin.",
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/security");
}

export async function reactivateUserAction(formData: FormData) {
  const actor = await requireAdminActor();
  const userId = formString(formData, "userId");
  if (!userId) throw new Error("User id is required.");

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, deactivatedAt: true },
  });

  if (!target) throw new Error("User not found.");
  if (!target.deactivatedAt) throw new Error("User is already active.");

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: {
        deactivatedAt: null,
        deactivatedReason: null,
      },
    }),
    db.accessAuditLog.create({
      data: {
        ownerUserId: userId,
        actorUserId: actor.id!,
        action: "ADMIN_USER_REACTIVATED",
        targetType: "USER",
        targetId: userId,
        metadataJson: "Admin reactivated account.",
      },
    }),
  ]);

  revalidatePath("/admin");
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
  if (target.emailVerified) throw new Error("User is already verified.");
  if (target.deactivatedAt) throw new Error("Cannot send verification to a deactivated account.");

  await sendEmailVerificationEmail({
    userId: target.id,
    email: target.email,
    name: target.name,
  });

  await writeAdminAuditLog({
    ownerUserId: target.id,
    actorUserId: actor.id!,
    action: "ADMIN_RESENT_VERIFICATION",
    note: `Verification email resent to ${target.email}`,
  });

  revalidatePath("/admin");
}

export async function revokeUserMobileSessionsAction(formData: FormData) {
  const actor = await requireAdminActor();
  const userId = formString(formData, "userId");
  if (!userId) throw new Error("User id is required.");

  const result = await db.mobileSessionToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  await writeAdminAuditLog({
    ownerUserId: userId,
    actorUserId: actor.id!,
    action: "ADMIN_REVOKED_MOBILE_SESSIONS",
    note: `Revoked ${result.count} mobile session(s).`,
  });

  revalidatePath("/admin");
  revalidatePath("/security");
}
