"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

const passwordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation must match.",
    path: ["confirmPassword"],
  });

function formString(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
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

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await db.user.update({
    where: { id: user.id! },
    data: { passwordHash },
  });

  revalidatePath("/security");
}

export async function revokeMobileSessionAction(formData: FormData) {
  const user = await requireUser();
  const tokenId = formString(formData, "tokenId");

  if (!tokenId) {
    throw new Error("Mobile session id is required.");
  }

  await db.mobileSessionToken.updateMany({
    where: {
      id: tokenId,
      userId: user.id!,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  revalidatePath("/security");
}

export async function revokeAllMobileSessionsAction() {
  const user = await requireUser();

  await db.mobileSessionToken.updateMany({
    where: {
      userId: user.id!,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  revalidatePath("/security");
}
