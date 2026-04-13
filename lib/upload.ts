import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";

const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

export async function saveUpload(file: File) {
  if (!allowed.includes(file.type)) throw new Error("Unsupported file type.");
  if (file.size > 5 * 1024 * 1024) throw new Error("File must be 5MB or smaller.");

  const bytes = await file.arrayBuffer();
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });

  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  await writeFile(path.join(dir, safeName), Buffer.from(bytes));

  return {
    filePath: `/uploads/${safeName}`,
    fileName: safeName,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}

export async function deleteUpload(filePath: string | null | undefined) {
  if (!filePath) return;

  const normalized = filePath.replace(/\\/g, "/");
  if (!normalized.startsWith("/uploads/")) return;

  const absolutePath = path.join(process.cwd(), "public", normalized.replace(/^\//, ""));
  await rm(absolutePath, { force: true });
}
