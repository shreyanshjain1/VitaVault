import { beforeEach, describe, expect, it, vi } from "vitest";

describe("account email helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.EMAIL_VERIFICATION_REQUIRED;
    delete process.env.APP_URL;
    delete process.env.NEXTAUTH_URL;
  });

  it("reports delivery config as disabled without env vars", async () => {
    const mod = await import("@/lib/account-email");
    expect(mod.isEmailDeliveryConfigured()).toBe(false);
  });

  it("reports delivery config as enabled when resend env vars exist", async () => {
    process.env.RESEND_API_KEY = "test_key";
    process.env.RESEND_FROM_EMAIL = "VitaVault <no-reply@example.com>";
    const mod = await import("@/lib/account-email");
    expect(mod.isEmailDeliveryConfigured()).toBe(true);
  });

  it("reports verification requirement from env", async () => {
    process.env.EMAIL_VERIFICATION_REQUIRED = "true";
    const mod = await import("@/lib/account-email");
    expect(mod.isEmailVerificationRequired()).toBe(true);
  });
});
