import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUserMock = vi.fn();
const compareMock = vi.fn();
const hashMock = vi.fn();
const revalidatePathMock = vi.fn();
const findUniqueMock = vi.fn();
const userUpdateMock = vi.fn();
const mobileUpdateManyMock = vi.fn();

vi.mock("@/lib/session", () => ({
  requireUser: requireUserMock,
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: compareMock,
    hash: hashMock,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: findUniqueMock,
      update: userUpdateMock,
    },
    mobileSessionToken: {
      updateMany: mobileUpdateManyMock,
    },
  },
}));

describe("security actions", () => {
  beforeEach(() => {
    vi.resetModules();
    requireUserMock.mockReset();
    compareMock.mockReset();
    hashMock.mockReset();
    revalidatePathMock.mockReset();
    findUniqueMock.mockReset();
    userUpdateMock.mockReset();
    mobileUpdateManyMock.mockReset();
    requireUserMock.mockResolvedValue({ id: "user_1" });
  });

  it("rejects password changes when confirmation does not match", async () => {
    const { changePasswordAction } = await import("@/app/security/actions");
    const formData = new FormData();
    formData.set("currentPassword", "old-password");
    formData.set("newPassword", "new-password-123");
    formData.set("confirmPassword", "different-password");

    await expect(changePasswordAction(formData)).rejects.toThrow(
      "New password and confirmation must match."
    );
  });

  it("updates the password hash for a valid password rotation", async () => {
    findUniqueMock.mockResolvedValue({ passwordHash: "stored-hash" });
    compareMock.mockResolvedValue(true);
    hashMock.mockResolvedValue("new-hash");

    const { changePasswordAction } = await import("@/app/security/actions");
    const formData = new FormData();
    formData.set("currentPassword", "old-password");
    formData.set("newPassword", "new-password-123");
    formData.set("confirmPassword", "new-password-123");

    await changePasswordAction(formData);

    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { passwordHash: "new-hash" },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/security");
  });

  it("revokes all active mobile sessions for the current user", async () => {
    const { revokeAllMobileSessionsAction } = await import("@/app/security/actions");

    await revokeAllMobileSessionsAction();

    expect(mobileUpdateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user_1",
          revokedAt: null,
        },
      })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/security");
  });
});
