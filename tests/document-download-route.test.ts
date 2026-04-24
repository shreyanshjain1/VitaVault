import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const readFileMock = vi.fn();
const findFirstMock = vi.fn();

vi.mock("fs/promises", () => ({
  readFile: readFileMock,
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    medicalDocument: {
      findFirst: findFirstMock,
    },
  },
}));

describe("protected document download route", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.mockReset();
    readFileMock.mockReset();
    findFirstMock.mockReset();
  });

  it("returns 401 for signed out users", async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/documents/[id]/download/route");

    const response = await GET(new Request("https://example.com"), {
      params: Promise.resolve({ id: "doc_1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when the document is not owned by the user", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    findFirstMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/documents/[id]/download/route");

    const response = await GET(new Request("https://example.com"), {
      params: Promise.resolve({ id: "doc_missing" }),
    });

    expect(findFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "doc_missing", userId: "user_1" },
      })
    );
    expect(response.status).toBe(404);
  });

  it("streams the document for the owning user", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    findFirstMock.mockResolvedValue({
      title: "Lab Result",
      fileName: "lab-result.pdf",
      filePath: "private:lab-result.pdf",
      mimeType: "application/pdf",
    });
    readFileMock.mockResolvedValue(Buffer.from("pdf"));
    const { GET } = await import("@/app/api/documents/[id]/download/route");

    const response = await GET(new Request("https://example.com"), {
      params: Promise.resolve({ id: "doc_1" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Cache-Control")).toContain("private");
    expect(response.headers.get("Content-Disposition")).toContain("inline");
    expect(readFileMock).toHaveBeenCalledOnce();
  });
});
