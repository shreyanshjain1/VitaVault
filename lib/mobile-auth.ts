import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const MOBILE_TOKEN_PREFIX = "vvm_";
const MOBILE_TOKEN_TTL_DAYS = 90;

export type MobileAuthUser = {
  id: string;
  email: string;
  name: string | null;
};

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function getBearerTokenFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token?.trim()) {
    return null;
  }

  return token.trim();
}

export async function createMobileSessionToken(params: {
  userId: string;
  name?: string | null;
  expiresAt?: Date;
}) {
  const rawToken = `${MOBILE_TOKEN_PREFIX}${crypto.randomBytes(32).toString("hex")}`;
  const tokenHash = sha256(rawToken);
  const expiresAt =
    params.expiresAt ??
    new Date(Date.now() + MOBILE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.mobileSessionToken.create({
    data: {
      userId: params.userId,
      name: params.name ?? null,
      tokenHash,
      expiresAt,
      lastUsedAt: new Date(),
    },
  });

  return {
    token: rawToken,
    expiresAt,
  };
}

export async function authenticateMobileCredentials(params: {
  email: string;
  password: string;
}) {
  const email = params.email.trim().toLowerCase();
  const password = params.password;

  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  } satisfies MobileAuthUser;
}

export async function requireMobileUser(request: Request) {
  const bearerToken = getBearerTokenFromRequest(request);
  if (!bearerToken) {
    return null;
  }

  const tokenHash = sha256(bearerToken);

  const session = await db.mobileSessionToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.revokedAt) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    return null;
  }

  await db.mobileSessionToken.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  });

  return session.user satisfies MobileAuthUser;
}

export async function revokeMobileToken(rawToken: string) {
  const tokenHash = sha256(rawToken);

  await db.mobileSessionToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}