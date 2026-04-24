import { randomBytes } from "crypto";
import { addHours } from "date-fns";

import { db } from "@/lib/db";

const EMAIL_VERIFICATION_PREFIX = "email-verify";
const PASSWORD_RESET_PREFIX = "password-reset";

function getBaseUrl() {
  const raw =
    process.env.APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000";

  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export function isEmailDeliveryConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim()
  );
}

export function isEmailVerificationRequired() {
  return String(process.env.EMAIL_VERIFICATION_REQUIRED || "false").toLowerCase() === "true";
}

async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    throw new Error("Email delivery is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email send failed (${response.status}): ${body}`);
  }
}

function buildVerificationIdentifier(userId: string) {
  return `${EMAIL_VERIFICATION_PREFIX}:${userId}`;
}

function buildResetIdentifier(userId: string) {
  return `${PASSWORD_RESET_PREFIX}:${userId}`;
}

function makeToken() {
  return randomBytes(24).toString("hex");
}

async function createStoredToken(args: {
  identifier: string;
  expiresAt: Date;
}) {
  await db.verificationToken.deleteMany({
    where: {
      identifier: args.identifier,
    },
  });

  const token = makeToken();

  await db.verificationToken.create({
    data: {
      identifier: args.identifier,
      token,
      expires: args.expiresAt,
    },
  });

  return token;
}

export async function sendEmailVerificationEmail(args: {
  userId: string;
  email: string;
  name?: string | null;
}) {
  const token = await createStoredToken({
    identifier: buildVerificationIdentifier(args.userId),
    expiresAt: addHours(new Date(), 24),
  });

  const verifyUrl = `${getBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const greeting = args.name?.trim() || "there";

  await sendEmail({
    to: args.email,
    subject: "Verify your VitaVault email",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Verify your VitaVault email</h2>
        <p>Hi ${greeting},</p>
        <p>Please verify your email address to secure your account.</p>
        <p>
          <a href="${verifyUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#111827;color:#ffffff;text-decoration:none;font-weight:600;">Verify email</a>
        </p>
        <p>If the button does not work, use this link:</p>
        <p>${verifyUrl}</p>
        <p>This link expires in 24 hours.</p>
      </div>
    `,
    text: `Hi ${greeting},\n\nVerify your VitaVault email: ${verifyUrl}\n\nThis link expires in 24 hours.`,
  });
}

export async function consumeEmailVerificationToken(token: string) {
  const record = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!record || !record.identifier.startsWith(`${EMAIL_VERIFICATION_PREFIX}:`)) {
    return { ok: false as const, message: "Invalid verification link." };
  }

  if (record.expires <= new Date()) {
    await db.verificationToken.delete({ where: { token } }).catch(() => null);
    return { ok: false as const, message: "This verification link has expired." };
  }

  const userId = record.identifier.split(":")[1];

  await db.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });

  await db.verificationToken.delete({ where: { token } });

  return { ok: true as const, message: "Your email has been verified." };
}

export async function sendPasswordResetEmail(args: {
  userId: string;
  email: string;
  name?: string | null;
}) {
  const token = await createStoredToken({
    identifier: buildResetIdentifier(args.userId),
    expiresAt: addHours(new Date(), 2),
  });

  const resetUrl = `${getBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const greeting = args.name?.trim() || "there";

  await sendEmail({
    to: args.email,
    subject: "Reset your VitaVault password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Reset your password</h2>
        <p>Hi ${greeting},</p>
        <p>Use the link below to set a new password for your VitaVault account.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#111827;color:#ffffff;text-decoration:none;font-weight:600;">Reset password</a>
        </p>
        <p>If the button does not work, use this link:</p>
        <p>${resetUrl}</p>
        <p>This link expires in 2 hours.</p>
      </div>
    `,
    text: `Hi ${greeting},\n\nReset your VitaVault password: ${resetUrl}\n\nThis link expires in 2 hours.`,
  });
}

export async function consumePasswordResetToken(token: string) {
  const record = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!record || !record.identifier.startsWith(`${PASSWORD_RESET_PREFIX}:`)) {
    return null;
  }

  if (record.expires <= new Date()) {
    await db.verificationToken.delete({ where: { token } }).catch(() => null);
    return null;
  }

  return {
    token: record.token,
    userId: record.identifier.split(":")[1],
  };
}

export async function clearPasswordResetToken(token: string) {
  await db.verificationToken.delete({ where: { token } }).catch(() => null);
}
