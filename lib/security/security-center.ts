import type { MobileSessionToken } from "@prisma/client";

export type SecurityReadinessInput = {
  hasPassword: boolean;
  emailVerified: boolean;
  activeMobileSessions: number;
  revokedMobileSessions: number;
  connectionCount: number;
  pendingCareInvites: number;
};

export type SecurityRiskTone =
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "info";

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

  const score = Math.round(
    (checks.filter((check) => check.passed).length / checks.length) * 100,
  );
  const riskTone: SecurityRiskTone =
    score >= 80 ? "success" : score >= 60 ? "warning" : "danger";

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

export function getMobileSessionRisk(
  session: Pick<
    MobileSessionToken,
    "expiresAt" | "revokedAt" | "lastUsedAt" | "createdAt"
  >,
) {
  if (session.revokedAt) {
    return {
      label: "Revoked",
      tone: "neutral" as const,
      detail: "This token can no longer access the mobile API.",
    };
  }

  const now = Date.now();
  const expiresAt = session.expiresAt.getTime();
  const lastUsedAt =
    session.lastUsedAt?.getTime() ?? session.createdAt.getTime();
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

export type SecurityReviewDashboardInput = {
  readinessScore: number;
  readinessTone: SecurityRiskTone;
  activeMobileSessions: number;
  staleOrExpiringSessions: number;
  revokedMobileSessions: number;
  connectionCount: number;
  pendingCareInvites: number;
  recentSensitiveActions: number;
};

export type SecurityReviewState = "healthy" | "monitor" | "review" | "critical";

export function getSecurityReviewState(
  input: SecurityReviewDashboardInput,
): SecurityReviewState {
  if (!input.readinessScore || input.readinessScore < 60) return "critical";
  if (input.staleOrExpiringSessions >= 3 || input.pendingCareInvites >= 3)
    return "critical";
  if (
    input.readinessScore < 80 ||
    input.staleOrExpiringSessions > 0 ||
    input.pendingCareInvites > 0
  )
    return "review";
  if (
    input.activeMobileSessions > 0 ||
    input.connectionCount > 0 ||
    input.recentSensitiveActions > 0
  )
    return "monitor";
  return "healthy";
}

export function getSecurityReviewStateLabel(state: SecurityReviewState) {
  const labels: Record<SecurityReviewState, string> = {
    healthy: "Healthy",
    monitor: "Monitor",
    review: "Needs review",
    critical: "Critical review",
  };
  return labels[state];
}

export function getSecurityReviewStateTone(
  state: SecurityReviewState,
): SecurityRiskTone {
  const tones: Record<SecurityReviewState, SecurityRiskTone> = {
    healthy: "success",
    monitor: "info",
    review: "warning",
    critical: "danger",
  };
  return tones[state];
}

export function buildSecurityReviewDashboard(
  input: SecurityReviewDashboardInput,
) {
  const state = getSecurityReviewState(input);
  const checklist = [
    {
      id: "readiness-score",
      label: "Readiness score is healthy",
      passed: input.readinessScore >= 80,
      tone:
        input.readinessScore >= 80
          ? ("success" as const)
          : input.readinessScore >= 60
            ? ("warning" as const)
            : ("danger" as const),
      detail: `Current readiness score is ${input.readinessScore}%.`,
    },
    {
      id: "session-risk",
      label: "Mobile/API sessions are current",
      passed: input.staleOrExpiringSessions === 0,
      tone:
        input.staleOrExpiringSessions === 0
          ? ("success" as const)
          : ("warning" as const),
      detail:
        input.staleOrExpiringSessions === 0
          ? "No stale or expiring mobile/API sessions were detected."
          : `${input.staleOrExpiringSessions} mobile/API session${input.staleOrExpiringSessions === 1 ? "" : "s"} should be reviewed.`,
    },
    {
      id: "care-invites",
      label: "Care-team invites are cleared",
      passed: input.pendingCareInvites === 0,
      tone:
        input.pendingCareInvites === 0
          ? ("success" as const)
          : ("warning" as const),
      detail:
        input.pendingCareInvites === 0
          ? "No pending care-team invitations are waiting for review."
          : `${input.pendingCareInvites} pending care invite${input.pendingCareInvites === 1 ? "" : "s"} should be accepted, resent, or revoked.`,
    },
    {
      id: "linked-exposure",
      label: "Linked exposure is manageable",
      passed: input.connectionCount <= 3 && input.activeMobileSessions <= 3,
      tone:
        input.connectionCount <= 3 && input.activeMobileSessions <= 3
          ? ("success" as const)
          : ("warning" as const),
      detail: `${input.connectionCount} device connection${input.connectionCount === 1 ? "" : "s"} and ${input.activeMobileSessions} active mobile/API session${input.activeMobileSessions === 1 ? "" : "s"}.`,
    },
  ];

  return {
    state,
    label: getSecurityReviewStateLabel(state),
    tone: getSecurityReviewStateTone(state),
    checklist,
    reviewQueue: checklist.filter((item) => !item.passed).length,
    nextStep:
      state === "critical"
        ? "Review high-risk security items before sharing records or connecting more devices."
        : state === "review"
          ? "Clear the warning items and re-check mobile sessions, care access, and linked devices."
          : state === "monitor"
            ? "Security posture is acceptable; keep monitoring active sessions and linked devices."
            : "Security posture is healthy. Continue routine review after sensitive workflow changes.",
  };
}
