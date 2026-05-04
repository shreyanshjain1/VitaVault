import { localDocumentStorageProvider } from "@/lib/storage/local-storage";
import type { DocumentStorageHealth, DocumentStorageProvider } from "@/lib/storage/storage-types";

export const DOCUMENT_STORAGE_PROVIDER = "local" as const;

export function getDocumentStorageProvider(): DocumentStorageProvider {
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
