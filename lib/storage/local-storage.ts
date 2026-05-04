import * as fs from "fs/promises";
import path from "path";
import {
  buildStoredDocumentPath,
  DOCUMENT_STORAGE_MODE,
  getPrivateUploadsDir,
  getPublicUploadsDir,
  resolveStoredDocumentPath,
} from "@/lib/document-storage";
import type {
  DocumentStorageHealth,
  DocumentStorageProvider,
  ResolvedDocumentObject,
  SaveDocumentObjectInput,
  SavedDocumentObject,
} from "@/lib/storage/storage-types";

function sanitizeOriginalName(value: string) {
  return path.basename(value || "document.bin").replace(/[^a-zA-Z0-9._-]/g, "-") || "document.bin";
}

function uniqueStoredName(originalName: string) {
  return `${Date.now()}-${sanitizeOriginalName(originalName)}`;
}

function uploadDir(storage: "private" | "public") {
  return storage === "public" ? getPublicUploadsDir() : getPrivateUploadsDir();
}

function toResolved(filePath: string | null | undefined): ResolvedDocumentObject | null {
  if (!filePath) return null;
  const resolved = resolveStoredDocumentPath(filePath);
  if (!resolved) return null;

  return {
    provider: "local",
    storage: resolved.storage,
    key: resolved.relativePath,
    filePath: resolved.relativePath,
    absolutePath: resolved.absolutePath,
  };
}

export const localDocumentStorageProvider: DocumentStorageProvider = {
  id: "local",
  label: "Local filesystem storage",

  async save(input: SaveDocumentObjectInput): Promise<SavedDocumentObject> {
    const stored = buildStoredDocumentPath(uniqueStoredName(input.originalName));
    await fs.mkdir(uploadDir(stored.storage), { recursive: true });
    await fs.writeFile(stored.absolutePath, input.bytes);

    return {
      provider: "local",
      storage: stored.storage,
      key: stored.filePath,
      filePath: stored.filePath,
      fileName: stored.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    };
  },

  async delete(filePath: string | null | undefined) {
    const resolved = toResolved(filePath);
    if (!resolved?.absolutePath) return;
    await fs.rm(resolved.absolutePath, { force: true });
  },

  resolve(filePath: string | null | undefined) {
    return toResolved(filePath);
  },

  async read(filePath: string) {
    const resolved = toResolved(filePath);
    if (!resolved?.absolutePath) {
      throw new Error("Document storage path is invalid.");
    }

    return {
      bytes: await fs.readFile(resolved.absolutePath),
      resolved,
    };
  },

  health(): DocumentStorageHealth {
    const mode = DOCUMENT_STORAGE_MODE;
    const dir = mode === "public" ? getPublicUploadsDir() : getPrivateUploadsDir();

    return {
      provider: "local",
      label: "Local filesystem storage",
      mode,
      ready: true,
      productionReady: false,
      detail: `Using ${mode} local storage at ${dir}. This is fine for local demos; production should move to S3, Cloudflare R2, Supabase Storage, or another durable object store.`,
    };
  },
};
