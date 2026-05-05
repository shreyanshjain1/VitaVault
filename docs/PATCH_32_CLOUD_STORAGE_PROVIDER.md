# Patch 32 — Real Cloud Storage Provider

## Summary

This patch upgrades the document storage abstraction from Patch 26 by adding a real S3-compatible cloud storage provider.

## Added

- `lib/storage/s3-storage.ts`
- S3-compatible signed upload, read, and delete operations
- Cloudflare R2 support through the same provider
- `DOCUMENT_STORAGE_PROVIDER` environment selection
- S3/R2 environment variables in `.env.example`
- Deployment checklist updates for cloud document storage
- Download route storage-provider header now reflects the actual provider

## Supported providers

```txt
local
s3
r2
```

## Required env for S3/R2

```txt
DOCUMENT_STORAGE_PROVIDER="s3"
S3_ENDPOINT="https://s3.amazonaws.com"
S3_REGION="us-east-1"
S3_BUCKET="your-bucket"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_FORCE_PATH_STYLE="true"
DOCUMENT_STORAGE_PREFIX="documents"
```

For Cloudflare R2, use either the `S3_*` variables with an R2 endpoint or the `R2_*` aliases.

## Migration impact

No Prisma migration is required.

Existing local files stay local. New uploaded files use the provider configured by `DOCUMENT_STORAGE_PROVIDER`.
