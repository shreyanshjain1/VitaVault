import { describe, expect, it } from "vitest";
import { evaluatePasswordPolicy } from "../lib/security/password-policy";
import {
  consumeRateLimit,
  resetRateLimitBucketsForTests,
} from "../lib/security/rate-limit";
import {
  buildSecurityReviewDashboard,
  getSecurityReadiness,
  getSecurityReviewState,
} from "../lib/security/security-center";

describe("security hardening helpers", () => {
  it("rejects weak passwords and accepts stronger password policy input", () => {
    const weak = evaluatePasswordPolicy("demo12345", {
      email: "patient@vitavault.demo",
      name: "Demo Patient",
    });
    expect(weak.passedRequired).toBe(false);
    expect(weak.failedRequiredLabels.length).toBeGreaterThan(0);

    const strong = evaluatePasswordPolicy("Vita!Secure2026", {
      email: "patient@vitavault.demo",
      name: "Demo Patient",
    });
    expect(strong.passedRequired).toBe(true);
    expect(strong.score).toBeGreaterThanOrEqual(80);
  });

  it("tracks rate limit windows and blocks after the configured limit", () => {
    resetRateLimitBucketsForTests();
    const now = new Date("2026-05-05T00:00:00.000Z");

    const first = consumeRateLimit({
      key: "test:login",
      limit: 2,
      windowMs: 60_000,
      now,
    });
    const second = consumeRateLimit({
      key: "test:login",
      limit: 2,
      windowMs: 60_000,
      now,
    });
    const third = consumeRateLimit({
      key: "test:login",
      limit: 2,
      windowMs: 60_000,
      now,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBe(60);
  });

  it("computes a security readiness score from account posture signals", () => {
    const result = getSecurityReadiness({
      hasPassword: true,
      emailVerified: true,
      activeMobileSessions: 1,
      revokedMobileSessions: 0,
      connectionCount: 1,
      pendingCareInvites: 0,
    });

    expect(result.score).toBe(100);
    expect(result.riskTone).toBe("success");
  });

  it("classifies security review dashboards from posture and exposure signals", () => {
    expect(
      getSecurityReviewState({
        readinessScore: 45,
        readinessTone: "danger",
        activeMobileSessions: 4,
        staleOrExpiringSessions: 3,
        revokedMobileSessions: 0,
        connectionCount: 4,
        pendingCareInvites: 2,
        recentSensitiveActions: 1,
      }),
    ).toBe("critical");

    const dashboard = buildSecurityReviewDashboard({
      readinessScore: 76,
      readinessTone: "warning",
      activeMobileSessions: 2,
      staleOrExpiringSessions: 1,
      revokedMobileSessions: 2,
      connectionCount: 2,
      pendingCareInvites: 1,
      recentSensitiveActions: 3,
    });

    expect(dashboard).toMatchObject({
      state: "review",
      label: "Needs review",
      tone: "warning",
      reviewQueue: 3,
    });
    expect(dashboard.checklist.map((item) => item.id)).toEqual([
      "readiness-score",
      "session-risk",
      "care-invites",
      "linked-exposure",
    ]);
  });
});
