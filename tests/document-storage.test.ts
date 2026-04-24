import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  delete process.env.DOCUMENT_STORAGE_MODE;
  delete process.env.PRIVATE_UPLOAD_DIR;
});

describe("document storage helpers", () => {
  it("builds private storage paths by default", async () => {
    const mod = await import("@/lib/document-storage");

    const result = mod.buildStoredDocumentPath("report final?.pdf");

    expect(result.storage).toBe("private");
    expect(result.filePath).toMatch(/^private:/);
    expect(result.fileName).toBe("report-final-.pdf");
    expect(result.absolutePath).toContain("private-uploads");
  });

  it("builds public storage paths when public mode is enabled", async () => {
    process.env.DOCUMENT_STORAGE_MODE = "public";
    const mod = await import("@/lib/document-storage");

    const result = mod.buildStoredDocumentPath("scan image.png");

    expect(result.storage).toBe("public");
    expect(result.filePath).toBe("/uploads/scan-image.png");
    expect(result.absolutePath).toContain("public");
  });

  it("resolves both private and public stored document paths safely", async () => {
    const mod = await import("@/lib/document-storage");

    const privatePath = mod.resolveStoredDocumentPath("private:../../secret.pdf");
    const publicPath = mod.resolveStoredDocumentPath("/uploads/../lab.png");
    const invalidPath = mod.resolveStoredDocumentPath("http://example.com/file.pdf");

    expect(privatePath).toEqual(
      expect.objectContaining({
        storage: "private",
        relativePath: "private:secret.pdf",
      })
    );
    expect(publicPath).toEqual(
      expect.objectContaining({
        storage: "public",
        relativePath: "/uploads/lab.png",
      })
    );
    expect(invalidPath).toBeNull();
  });
});
