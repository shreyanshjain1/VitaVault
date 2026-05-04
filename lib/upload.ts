import { deleteDocumentObject, saveDocumentObject } from "@/lib/storage";

const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function saveUpload(file: File) {
  if (!allowed.includes(file.type)) throw new Error("Unsupported file type.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("File must be 5MB or smaller.");

  const saved = await saveDocumentObject(file);

  return {
    filePath: saved.filePath,
    fileName: saved.fileName,
    mimeType: saved.mimeType,
    sizeBytes: saved.sizeBytes,
  };
}

export async function deleteUpload(filePath: string | null | undefined) {
  await deleteDocumentObject(filePath);
}
