# Patch 26 — Production Document Storage Abstraction

## Summary

Patch 26 moves VitaVault's document upload/download/delete flow behind a storage provider abstraction.

The current implementation keeps the existing local filesystem behavior as the default so local development and current tests remain compatible, while creating a clean path for future production providers such as S3, Cloudflare R2, Supabase Storage, Azure Blob Storage, or Google Cloud Storage.

## Files changed

- `lib/storage/storage-types.ts`
- `lib/storage/local-storage.ts`
- `lib/storage/index.ts`
- `lib/upload.ts`
- `app/api/documents/[id]/download/route.ts`
- `lib/ops-health.ts`
- `docs/PATCH_26_DOCUMENT_STORAGE_ABSTRACTION.md`

## What changed

- Added a document storage provider interface.
- Added a local filesystem provider that preserves the existing private/public storage behavior.
- Centralized document save, read, resolve, and delete helpers.
- Updated upload helpers to use the provider abstraction.
- Updated secure document download route to read through the provider abstraction.
- Added document storage readiness visibility to the Operations Command Center.
- Kept existing medical document schema unchanged.

## Why this matters

Before this patch, document storage logic was split between upload helpers, path helpers, and the download route. That works locally, but it makes production storage harder to add safely.

After this patch, future storage providers can be added behind the same interface without rewriting the Documents page, upload action, or download route.

## Current provider

The active provider is:

```txt
local
```

Local storage is still best for local development and demos. Production deployments should eventually move to a durable object store.

## Future provider path

A future S3/R2/Supabase provider should implement:

```ts
DocumentStorageProvider
```

Required provider methods:

- `save(input)`
- `delete(filePath)`
- `resolve(filePath)`
- `read(filePath)`
- `health()`

## Migration impact

No Prisma migration required.
