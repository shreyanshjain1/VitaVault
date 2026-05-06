"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { assertPasswordMeetsPolicy } from "@/lib/security/password-policy";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(1, "New password is required."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation must match.",
    path: ["confirmPassword"],
  });

function formString(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

async function writeSecurityAudit(params: {
  ownerUserId: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.accessAuditLog.create({
    data: {
      ownerUserId: params.ownerUserId,
      actorUserId: params.actorUserId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();

  const parsed = passwordSchema.safeParse({
    currentPassword: formString(formData, "currentPassword"),
    newPassword: formString(formData, "newPassword"),
    confirmPassword: formString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid password input.");
  }

  const account = await db.user.findUnique({
    where: { id: user.id! },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
    },
  });

  if (!account?.passwordHash) {
    throw new Error("This account does not currently support password rotation.");
  }

  const currentValid = await bcrypt.compare(
    parsed.data.currentPassword,
    account.passwordHash
  );

  if (!currentValid) {
    throw new Error("Current password is incorrect.");
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    throw new Error("Choose a new password that is different from the current password.");
  }

  const policy = assertPasswordMeetsPolicy(parsed.data.newPassword, {
    email: account.email,
    name: account.name,
  });

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await db.user.update({
    where: { id: user.id! },
    data: { passwordHash },
  });

  await writeSecurityAudit({
    ownerUserId: user.id!,
    actorUserId: user.id!,
    action: "PASSWORD_ROTATED",
    targetType: "USER",
    targetId: user.id!,
    metadata: {
      policyScore: policy.score,
      requiredChecksPassed: policy.passedRequired,
    },
  });

  revalidatePath("/security");
  revalidatePath("/audit-log");
}

export async function revokeMobileSessionAction(formData: FormData) {
  const user = await requireUser();
  const tokenId = formString(formData, "tokenId");
  const confirmation = formString(formData, "confirmation").toUpperCase();

  if (!tokenId) {
    throw new Error("Mobile session id is required.");
  }

  if (confirmation !== "REVOKE") {
    throw new Error("Type REVOKE to confirm this mobile/API session revocation.");
  }

  const result = await db.mobileSessionToken.updateMany({
    where: {
      id: tokenId,
      userId: user.id!,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  const revokedCount = result?.count ?? 0;

  if (revokedCount > 0) {
    await writeSecurityAudit({
      ownerUserId: user.id!,
      actorUserId: user.id!,
      action: "MOBILE_SESSION_REVOKED",
      targetType: "MOBILE_SESSION_TOKEN",
      targetId: tokenId,
      metadata: {
        source: "security_center",
      },
    });
  }

  revalidatePath("/security");
  revalidatePath("/audit-log");
}

export async function revokeAllMobileSessionsAction(formData?: FormData) {
  const user = await requireUser();
  const confirmation = formData ? formString(formData, "confirmation").toUpperCase() : "REVOKE ALL";

  if (confirmation !== "REVOKE ALL") {
    throw new Error("Type REVOKE ALL to confirm revoking every active mobile/API session.");
  }

  const result = await db.mobileSessionToken.updateMany({
    where: {
      userId: user.id!,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  const revokedCount = result?.count ?? 0;

  if (revokedCount > 0) {
    await writeSecurityAudit({
      ownerUserId: user.id!,
      actorUserId: user.id!,
      action: "ALL_MOBILE_SESSIONS_REVOKED",
      targetType: "MOBILE_SESSION_TOKEN",
      targetId: user.id!,
      metadata: {
        revokedCount,
        source: "security_center",
      },
    });
  }

  revalidatePath("/security");
  revalidatePath("/audit-log");
}
