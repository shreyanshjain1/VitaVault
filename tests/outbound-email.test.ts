import { beforeEach, describe, expect, it, vi } from "vitest";
import { AlertSeverity, AlertStatus, ReminderState } from "@prisma/client";

describe("outbound email helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  it("reports outbound delivery as disabled without env vars", async () => {
    const mod = await import("@/lib/outbound-email");
    expect(mod.outboundEmailEnabled()).toBe(false);
  });

  it("throws when reminder email delivery is attempted without configuration", async () => {
    const mod = await import("@/lib/outbound-email");

    await expect(
      mod.sendReminderEmail({
        to: "patient@example.com",
        patientName: "Patient",
        reminder: {
          id: "rem_1",
          title: "Medication reminder",
          description: "Take your evening dose",
          dueAt: new Date("2026-04-25T10:00:00.000Z"),
          state: ReminderState.DUE,
          timezone: "Asia/Manila",
          gracePeriodMinutes: 30,
        },
      })
    ).rejects.toThrow("Email delivery is not configured.");
  });

  it("sends an alert digest email through Resend when configured", async () => {
    process.env.RESEND_API_KEY = "resend_test_key";
    process.env.RESEND_FROM_EMAIL = "VitaVault <no-reply@example.com>";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "msg_456" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const mod = await import("@/lib/outbound-email");
    await mod.sendAlertDigestEmail({
      to: "patient@example.com",
      patientName: "Patient",
      alerts: [
        {
          id: "alert_1",
          title: "High heart rate",
          message: "Heart rate stayed elevated.",
          severity: AlertSeverity.CRITICAL,
          status: AlertStatus.OPEN,
          createdAt: new Date("2026-04-25T10:00:00.000Z"),
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(request.body));

    expect(payload.subject).toContain("1 open alert");
    expect(payload.to).toEqual(["patient@example.com"]);
  });
});
