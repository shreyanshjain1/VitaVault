import { localDocumentStorageProvider } from "@/lib/storage/local-storage";
import { createS3CompatibleDocumentStorageProvider } from "@/lib/storage/s3-storage";
import type { DocumentStorageHealth, DocumentStorageProvider, DocumentStorageProviderId } from "@/lib/storage/storage-types";

export function getConfiguredDocumentStorageProviderId(): DocumentStorageProviderId {
  const provider = String(process.env.DOCUMENT_STORAGE_PROVIDER || "local").toLowerCase();

  if (provider === "s3") return "s3";
  if (provider === "r2") return "r2";

  return "local";
}

export function getDocumentStorageProvider(): DocumentStorageProvider {
  const provider = getConfiguredDocumentStorageProviderId();

  if (provider === "s3" || provider === "r2") {
    return createS3CompatibleDocumentStorageProvider(provider);
  }

  return localDocumentStorageProvider;
}

export function getDocumentStorageHealth(): DocumentStorageHealth {
  return getDocumentStorageProvider().health();
}

export async function saveDocumentObject(file: File) {
  const provider = getDocumentStorageProvider();
  const bytes = Buffer.from(await file.arrayBuffer());

  return provider.save({
    originalName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    bytes,
  });
}

export async function deleteDocumentObject(filePath: string | null | undefined) {
  await getDocumentStorageProvider().delete(filePath);
}

export async function readDocumentObject(filePath: string) {
  return getDocumentStorageProvider().read(filePath);
}

export function resolveDocumentObject(filePath: string | null | undefined) {
  return getDocumentStorageProvider().resolve(filePath);
}

export type {
  DocumentStorageHealth,
  DocumentStorageProvider,
  DocumentStorageProviderId,
  DocumentStorageVisibility,
  ReadDocumentObjectResult,
  ResolvedDocumentObject,
  SavedDocumentObject,
  SaveDocumentObjectInput,
} from "@/lib/storage/storage-types";
