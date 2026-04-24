import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppRole } from "@prisma/client";

const authMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

describe("internal api auth", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.mockReset();
    delete process.env.INTERNAL_API_SECRET;
  });

  it("authorizes via authenticated session first", async () => {
    authMock.mockResolvedValue({
      user: { id: "user_1", role: AppRole.ADMIN, email: "admin@example.com", name: "Admin" },
    });
    const { authenticateInternalRequest } = await import("@/lib/internal-api-auth");

    const result = await authenticateInternalRequest(new Request("https://example.com/api"));

    expect(result).toEqual({
      ok: true,
      kind: "session",
      user: {
        id: "user_1",
        role: AppRole.ADMIN,
        email: "admin@example.com",
        name: "Admin",
      },
    });
  });

  it("authorizes via bearer token when session is absent", async () => {
    authMock.mockResolvedValue(null);
    process.env.INTERNAL_API_SECRET = "super-secret";
    const { authenticateInternalRequest } = await import("@/lib/internal-api-auth");

    const result = await authenticateInternalRequest(
      new Request("https://example.com/api", {
        headers: { authorization: "Bearer super-secret" },
      })
    );

    expect(result).toEqual({ ok: true, kind: "token" });
  });

  it("enforces alert scan permissions correctly", async () => {
    const { canManageAllAlertScans, canEvaluateAlertsForUser } = await import("@/lib/internal-api-auth");

    expect(canManageAllAlertScans(AppRole.ADMIN)).toBe(true);
    expect(canManageAllAlertScans(AppRole.PATIENT)).toBe(false);
    expect(
      canEvaluateAlertsForUser({ actorId: "u1", actorRole: AppRole.PATIENT, targetUserId: "u1" })
    ).toBe(true);
    expect(
      canEvaluateAlertsForUser({ actorId: "u1", actorRole: AppRole.PATIENT, targetUserId: "u2" })
    ).toBe(false);
    expect(
      canEvaluateAlertsForUser({ actorId: "admin", actorRole: AppRole.ADMIN, targetUserId: "u2" })
    ).toBe(true);
  });
});
