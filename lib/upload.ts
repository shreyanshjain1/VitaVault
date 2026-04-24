import { mkdir, rm, writeFile } from "fs/promises";
import { buildStoredDocumentPath, getPublicUploadsDir, getPrivateUploadsDir, resolveStoredDocumentPath } from "@/lib/document-storage";

const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

export async function saveUpload(file: File) {
  if (!allowed.includes(file.type)) throw new Error("Unsupported file type.");
  if (file.size > 5 * 1024 * 1024) throw new Error("File must be 5MB or smaller.");

  const bytes = await file.arrayBuffer();
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  const stored = buildStoredDocumentPath(safeName);
  const dir = stored.storage === "public" ? getPublicUploadsDir() : getPrivateUploadsDir();
  await mkdir(dir, { recursive: true });
  await writeFile(stored.absolutePath, Buffer.from(bytes));

  return {
    filePath: stored.filePath,
    fileName: stored.fileName,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}

export async function deleteUpload(filePath: string | null | undefined) {
  if (!filePath) return;

  const resolved = resolveStoredDocumentPath(filePath);
  if (!resolved) return;

  await rm(resolved.absolutePath, { force: true });
}
