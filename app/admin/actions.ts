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
    },
  });

  if (!target) throw new Error("User not found.");
  if (target.emailVerified) throw new Error("User is already verified.");

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
