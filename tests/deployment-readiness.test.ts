import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDemoReadinessSummary,
  getDeploymentChecks,
  getDeploymentReadinessSummary,
  getSanitizedDeploymentEnvironment,
} from "@/lib/deployment-readiness";

const trackedKeys = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "NEXTAUTH_URL",
  "APP_URL",
  "REDIS_URL",
  "INTERNAL_API_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "OPENAI_API_KEY",
  "DOCUMENT_STORAGE_MODE",
  "PRIVATE_UPLOAD_DIR",
  "HEALTHCHECK_URL",
  "VITAVAULT_DEMO_MODE",
  "NEXT_PUBLIC_DEMO_MODE",
  "NODE_ENV",
];

const originalEnv = { ...process.env };

function clearTrackedEnv() {
  for (const key of trackedKeys) {
    delete process.env[key];
  }
}

function configureRequiredEnv() {
  process.env.DATABASE_URL = "postgresql://demo:demo@localhost:5432/vitavault";
  process.env.AUTH_SECRET = "super-long-random-secret-for-tests";
  process.env.NEXTAUTH_URL = "http://localhost:3000";
  process.env.APP_URL = "http://localhost:3000";
}

function configureRecommendedEnv() {
  process.env.REDIS_URL = "redis://127.0.0.1:6379";
  process.env.INTERNAL_API_SECRET = "internal-secret";
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.RESEND_FROM_EMAIL = "VitaVault <noreply@example.test>";
  process.env.OPENAI_API_KEY = "sk-test";
  process.env.DOCUMENT_STORAGE_MODE = "private";
  process.env.PRIVATE_UPLOAD_DIR = "./private-uploads";
}

describe("deployment readiness", () => {
  beforeEach(() => {
    clearTrackedEnv();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("marks required environment variables as blocking when missing", () => {
    const summary = getDeploymentReadinessSummary();

    expect(summary.mode).toBe("blocked");
    expect(summary.requiredTotal).toBeGreaterThanOrEqual(4);
    expect(summary.requiredConfigured).toBe(0);
    expect(summary.blockingIssues.map((item) => item.key)).toEqual(
      expect.arrayContaining([
        "DATABASE_URL",
        "AUTH_SECRET",
        "NEXTAUTH_URL",
        "APP_URL",
      ]),
    );
    expect(summary.score).toBe(0);
    expect(summary.guidance[0]).toContain(
      "Configure required production environment variables",
    );
  });

  it("does not treat placeholder values as production-ready", () => {
    process.env.DATABASE_URL =
      "postgresql://user:password@localhost:5432/db_name";
    process.env.AUTH_SECRET = "change-this-secret";
    process.env.NEXTAUTH_URL = "https://example.com";
    process.env.APP_URL = "https://example.com";

    const checks = getDeploymentChecks();
    const required = checks.filter((item) => item.category === "required");

    expect(required.every((item) => item.configured === false)).toBe(true);
    expect(required.every((item) => item.tone === "danger")).toBe(true);
  });

  it("calculates review-ready mode when required config exists but recommended services are missing", () => {
    configureRequiredEnv();

    const summary = getDeploymentReadinessSummary();

    expect(summary.mode).toBe("review-ready");
    expect(summary.blockingIssues).toHaveLength(0);
    expect(summary.warningIssues.length).toBeGreaterThan(0);
    expect(summary.requiredConfigured).toBe(summary.requiredTotal);
    expect(summary.recommendedConfigured).toBeLessThan(
      summary.recommendedTotal,
    );
  });

  it("calculates production readiness when required and recommended services are configured", () => {
    configureRequiredEnv();
    configureRecommendedEnv();

    const summary = getDeploymentReadinessSummary();

    expect(summary.mode).toBe("production-ready");
    expect(summary.blockingIssues).toHaveLength(0);
    expect(summary.requiredConfigured).toBe(summary.requiredTotal);
    expect(summary.recommendedConfigured).toBe(summary.recommendedTotal);
    expect(summary.score).toBe(100);
  });

  it("builds demo readiness guidance for reviewer-friendly validation", () => {
    configureRequiredEnv();
    process.env.VITAVAULT_DEMO_MODE = "true";
    vi.stubEnv("NODE_ENV", "production");

    const summary = getDemoReadinessSummary();

    expect(summary.ready).toBe(true);
    expect(summary.blocking).toHaveLength(0);
    expect(summary.checks.map((check) => check.key)).toEqual(
      expect.arrayContaining([
        "demo-mode",
        "database-minimum",
        "auth-minimum",
        "static-demo-routes",
      ]),
    );
    expect(summary.guidance).toEqual(
      expect.arrayContaining(["Reviewer demo readiness is acceptable."]),
    );
  });

  it("sanitizes sensitive values before exposing environment readiness", () => {
    configureRequiredEnv();
    process.env.INTERNAL_API_SECRET = "secret-value-that-should-not-render";
    process.env.OPENAI_API_KEY = "sk-real-looking-test-value";

    const safeEnvironment = getSanitizedDeploymentEnvironment();
    const configuredSecretValues = safeEnvironment.filter(
      (item) =>
        item.configured &&
        (item.key.includes("SECRET") || item.key.includes("KEY")),
    );

    expect(configuredSecretValues.length).toBeGreaterThan(0);
    expect(
      configuredSecretValues.every(
        (item) => item.safeValue === "Configured secret",
      ),
    ).toBe(true);
    expect(JSON.stringify(safeEnvironment)).not.toContain(
      "secret-value-that-should-not-render",
    );
    expect(JSON.stringify(safeEnvironment)).not.toContain(
      "sk-real-looking-test-value",
    );
  });
});
