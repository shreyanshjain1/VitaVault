"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  clearPasswordResetToken,
  consumePasswordResetToken,
  isEmailDeliveryConfigured,
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
} from "@/lib/account-email";

export type AccountActionState = {
  error: string | null;
  success: string | null;
};

const initialResponse = { error: null, success: null } satisfies AccountActionState;

const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8).max(64),
    confirmPassword: z.string().min(8).max(64),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export async function resendVerificationEmailAction(): Promise<AccountActionState> {
  const user = await requireUser();

  if (!user.email) {
    return { error: "Signed-in user has no email address.", success: null };
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id! },
    select: { id: true, email: true, name: true, emailVerified: true },
  });

  if (!dbUser) {
    return { error: "User not found.", success: null };
  }

  if (dbUser.emailVerified) {
    return { error: null, success: "Your email is already verified." };
  }

  if (!isEmailDeliveryConfigured()) {
    return {
      error: "Verification email delivery is not configured yet.",
      success: null,
    };
  }

  await sendEmailVerificationEmail({
    userId: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
  });

  return {
    error: null,
    success: "Verification email sent. Please check your inbox.",
  };
}

export async function forgotPasswordAction(
  _: AccountActionState = initialResponse,
  formData: FormData
): Promise<AccountActionState> {
  void _;

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
      success: null,
    };
  }

  if (!isEmailDeliveryConfigured()) {
    return {
      error: "Password reset email delivery is not configured yet.",
      success: null,
    };
  }

  const email = parsed.data.email.toLowerCase().trim();

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true },
  });

  if (user?.passwordHash) {
    await sendPasswordResetEmail({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
  }

  return {
    error: null,
    success: "If an account exists for that email, a reset link has been sent.",
  };
}

export async function resetPasswordAction(
  _: AccountActionState = initialResponse,
  formData: FormData
): Promise<AccountActionState> {
  void _;

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid password reset request.",
      success: null,
    };
  }

  const tokenRecord = await consumePasswordResetToken(parsed.data.token);

  if (!tokenRecord) {
    return {
      error: "This reset link is invalid or expired.",
      success: null,
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.user.update({
    where: { id: tokenRecord.userId },
    data: { passwordHash },
  });

  await clearPasswordResetToken(tokenRecord.token);

  return {
    error: null,
    success: "Password updated. You can now sign in with your new password.",
  };
}
