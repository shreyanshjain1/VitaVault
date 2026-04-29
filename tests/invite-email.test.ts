import { beforeEach, describe, expect, it, vi } from "vitest";

describe("care invite email helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  it("reports invite delivery as disabled without env vars", async () => {
    const mod = await import("@/lib/invite-email");
    expect(mod.isInviteEmailConfigured()).toBe(false);
  });

  it("returns a non-attempted result when invite email delivery is not configured", async () => {
    const mod = await import("@/lib/invite-email");

    const result = await mod.sendCareInviteEmail({
      to: "invitee@example.com",
      inviteLink: "https://example.com/invite/token",
      ownerName: "Patient Name",
      ownerEmail: "patient@example.com",
      accessRole: "CAREGIVER",
      expiresAt: new Date("2026-04-25T10:00:00.000Z"),
      note: "Please review the latest records.",
    });

    expect(result).toEqual({
      attempted: false,
      sent: false,
      reason: "Invite email delivery is not configured.",
    });
  });

  it("sends the invite email through Resend when configured", async () => {
    process.env.RESEND_API_KEY = "resend_test_key";
    process.env.RESEND_FROM_EMAIL = "VitaVault <no-reply@example.com>";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "msg_123" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const mod = await import("@/lib/invite-email");
    const result = await mod.sendCareInviteEmail({
      to: "invitee@example.com",
      inviteLink: "https://example.com/invite/token",
      ownerName: "Patient <Name>",
      ownerEmail: "patient@example.com",
      accessRole: "CAREGIVER",
      expiresAt: new Date("2026-04-25T10:00:00.000Z"),
      note: "Bring reports & prescriptions.",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toEqual({
      attempted: true,
      sent: true,
      provider: "resend",
      messageId: "msg_123",
    });
  });
});
