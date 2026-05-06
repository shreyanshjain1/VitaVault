import type { MobileSessionToken } from "@prisma/client";

export type SecurityReadinessInput = {
  hasPassword: boolean;
  emailVerified: boolean;
  activeMobileSessions: number;
  revokedMobileSessions: number;
  connectionCount: number;
  pendingCareInvites: number;
};

export type SecurityRiskTone = "success" | "warning" | "danger" | "neutral" | "info";

export function getSecurityReadiness(input: SecurityReadinessInput) {
  const checks = [
    {
      id: "password",
      label: "Password configured",
      passed: input.hasPassword,
      tone: input.hasPassword ? "success" : "danger",
    },
    {
      id: "email",
      label: "Email verified",
      passed: input.emailVerified,
      tone: input.emailVerified ? "success" : "warning",
    },
    {
      id: "mobile_sessions",
      label: "Mobile/API sessions reviewed",
      passed: input.activeMobileSessions <= 3,
      tone: input.activeMobileSessions <= 3 ? "success" : "warning",
    },
    {
      id: "care_invites",
      label: "No pending care invites",
      passed: input.pendingCareInvites === 0,
      tone: input.pendingCareInvites === 0 ? "success" : "warning",
    },
    {
      id: "device_links",
      label: "External device links reviewed",
      passed: input.connectionCount <= 3,
      tone: input.connectionCount <= 3 ? "success" : "warning",
    },
  ] as const;

  const score = Math.round((checks.filter((check) => check.passed).length / checks.length) * 100);
  const riskTone: SecurityRiskTone = score >= 80 ? "success" : score >= 60 ? "warning" : "danger";

  return {
    score,
    riskTone,
    checks,
    nextAction:
      score >= 80
        ? "Security posture looks healthy. Continue reviewing sessions and care access regularly."
        : "Review the warning items before sharing more health data or connecting new devices.",
  };
}

export function getMobileSessionRisk(session: Pick<MobileSessionToken, "expiresAt" | "revokedAt" | "lastUsedAt" | "createdAt">) {
  if (session.revokedAt) {
    return {
      label: "Revoked",
      tone: "neutral" as const,
      detail: "This token can no longer access the mobile API.",
    };
  }

  const now = Date.now();
  const expiresAt = session.expiresAt.getTime();
  const lastUsedAt = session.lastUsedAt?.getTime() ?? session.createdAt.getTime();
  const daysUntilExpiry = Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000));
  const daysSinceUse = Math.floor((now - lastUsedAt) / (24 * 60 * 60 * 1000));

  if (expiresAt <= now) {
    return {
      label: "Expired",
      tone: "warning" as const,
      detail: "This token is past its expiry date and should be cleaned up.",
    };
  }

  if (daysSinceUse >= 30) {
    return {
      label: "Stale",
      tone: "warning" as const,
      detail: `No mobile/API activity for ${daysSinceUse} days. Revoke it if the device is no longer used.`,
    };
  }

  if (daysUntilExpiry <= 7) {
    return {
      label: "Expiring soon",
      tone: "warning" as const,
      detail: `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}.`,
    };
  }

  return {
    label: "Healthy",
    tone: "success" as const,
    detail: "Recently active and not close to expiry.",
  };
}
