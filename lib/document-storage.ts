import path from "path";

export const DOCUMENT_STORAGE_MODE =
  process.env.DOCUMENT_STORAGE_MODE === "public" ? "public" : "private";

function sanitizeStoredName(value: string) {
  return path.basename(value).replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function getPrivateUploadsDir() {
  return path.join(process.cwd(), process.env.PRIVATE_UPLOAD_DIR || "private-uploads");
}

export function getPublicUploadsDir() {
  return path.join(process.cwd(), "public", "uploads");
}

export function buildStoredDocumentPath(fileName: string) {
  const safeName = sanitizeStoredName(fileName);

  if (DOCUMENT_STORAGE_MODE === "public") {
    return {
      storage: "public" as const,
      absolutePath: path.join(getPublicUploadsDir(), safeName),
      filePath: `/uploads/${safeName}`,
      fileName: safeName,
    };
  }

  return {
    storage: "private" as const,
    absolutePath: path.join(getPrivateUploadsDir(), safeName),
    filePath: `private:${safeName}`,
    fileName: safeName,
  };
}

export function resolveStoredDocumentPath(filePath: string) {
  const normalized = String(filePath || "").replace(/\\/g, "/").trim();

  if (normalized.startsWith("private:")) {
    const storedName = sanitizeStoredName(normalized.slice("private:".length));
    return {
      storage: "private" as const,
      absolutePath: path.join(getPrivateUploadsDir(), storedName),
      relativePath: `private:${storedName}`,
    };
  }

  if (normalized.startsWith("/uploads/")) {
    const storedName = sanitizeStoredName(normalized.slice("/uploads/".length));
    return {
      storage: "public" as const,
      absolutePath: path.join(getPublicUploadsDir(), storedName),
      relativePath: `/uploads/${storedName}`,
    };
  }

  return null;
}
