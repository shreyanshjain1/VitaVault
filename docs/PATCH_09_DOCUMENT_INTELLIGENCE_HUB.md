# Patch 09 — Document Intelligence Hub

## Summary

This patch upgrades the Documents module from a basic protected upload list into a stronger health-record document hub.

The feature is intentionally schema-safe. It uses the existing `MedicalDocument` fields, existing document upload actions, existing linked-record metadata, and existing protected download route.

## Added

- Document intelligence command center
- Readiness score for uploaded documents
- Link coverage metric
- Notes coverage metric
- Storage footprint summary
- Review readiness panel
- Document type breakdown
- Search and filtering by title, file name, notes, type, link status, and readiness
- Linked/unlinked status pills on each document
- Notes coverage status pills on each document
- Suggested next-step panel for unlinked files
- Shared `lib/document-hub.ts` helper layer

## Changed

- `app/documents/page.tsx` now includes a richer document hub UI while preserving existing upload, metadata edit, linked-record selection, secure file download, and delete functionality.

## No migration required

This patch does not add or change Prisma models. It reuses the existing `MedicalDocument` fields.

## Manual test routes

- `/documents`
- `/documents?q=lab`
- `/documents?link=UNLINKED`
- `/documents?quality=NEEDS_NOTES`
- `/documents?quality=READY`

## Recommended checks

```bash
npm run typecheck
npm run lint
npm run test:run
```
