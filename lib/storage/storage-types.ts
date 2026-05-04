export type DocumentStorageProviderId = "local" | "s3" | "r2" | "supabase";

export type DocumentStorageVisibility = "private" | "public";

export type DocumentStorageHealth = {
  provider: DocumentStorageProviderId;
  label: string;
  mode: DocumentStorageVisibility;
  ready: boolean;
  detail: string;
  productionReady: boolean;
};

export type SaveDocumentObjectInput = {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  bytes: Buffer;
};

export type SavedDocumentObject = {
  provider: DocumentStorageProviderId;
  storage: DocumentStorageVisibility;
  key: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type ResolvedDocumentObject = {
  provider: DocumentStorageProviderId;
  storage: DocumentStorageVisibility;
  key: string;
  filePath: string;
  absolutePath?: string;
};

export type ReadDocumentObjectResult = {
  bytes: Buffer;
  resolved: ResolvedDocumentObject;
};

export type DocumentStorageProvider = {
  id: DocumentStorageProviderId;
  label: string;
  save(input: SaveDocumentObjectInput): Promise<SavedDocumentObject>;
  delete(filePath: string | null | undefined): Promise<void>;
  resolve(filePath: string | null | undefined): ResolvedDocumentObject | null;
  read(filePath: string): Promise<ReadDocumentObjectResult>;
  health(): DocumentStorageHealth;
};
