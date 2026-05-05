import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDeploymentChecks, getDeploymentReadinessSummary } from "@/lib/deployment-readiness";

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
];

const originalEnv = { ...process.env };

function clearTrackedEnv() {
  for (const key of trackedKeys) {
    delete process.env[key];
  }
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

    expect(summary.requiredTotal).toBeGreaterThanOrEqual(4);
    expect(summary.requiredConfigured).toBe(0);
    expect(summary.blockingIssues.map((item) => item.key)).toEqual(
      expect.arrayContaining(["DATABASE_URL", "AUTH_SECRET", "NEXTAUTH_URL", "APP_URL"]),
    );
    expect(summary.score).toBe(0);
  });

  it("does not treat placeholder values as production-ready", () => {
    process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/db_name";
    process.env.AUTH_SECRET = "change-this-secret";
    process.env.NEXTAUTH_URL = "https://example.com";
    process.env.APP_URL = "https://example.com";

    const checks = getDeploymentChecks();
    const required = checks.filter((item) => item.category === "required");

    expect(required.every((item) => item.configured === false)).toBe(true);
    expect(required.every((item) => item.tone === "danger")).toBe(true);
  });

  it("calculates readiness when required and recommended services are configured", () => {
    process.env.DATABASE_URL = "postgresql://demo:demo@localhost:5432/vitavault";
    process.env.AUTH_SECRET = "super-long-random-secret-for-tests";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    process.env.APP_URL = "http://localhost:3000";
    process.env.REDIS_URL = "redis://127.0.0.1:6379";
    process.env.INTERNAL_API_SECRET = "internal-secret";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_FROM_EMAIL = "VitaVault <noreply@example.test>";
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.DOCUMENT_STORAGE_MODE = "private";
    process.env.PRIVATE_UPLOAD_DIR = "./private-uploads";

    const summary = getDeploymentReadinessSummary();

    expect(summary.blockingIssues).toHaveLength(0);
    expect(summary.requiredConfigured).toBe(summary.requiredTotal);
    expect(summary.recommendedConfigured).toBe(summary.recommendedTotal);
    expect(summary.score).toBe(100);
  });
});
