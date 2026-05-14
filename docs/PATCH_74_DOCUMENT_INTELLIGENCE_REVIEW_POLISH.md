# Patch 74 — Document Intelligence Review Polish

## Summary

This patch improves VitaVault's Documents workspace with clearer document review states, review queue counts, and provider-ready next-step guidance.

## Changes

- Added document review states for review-ready, needs link, needs notes, stale review, missing source file, and general review gaps.
- Added document review cards and an intelligence summary to `buildDocumentHub()`.
- Added a Document Intelligence Review Queue panel to `/documents`.
- Added review-state badges, reasons, next steps, and checklists to document cards.
- Added focused tests for document review classification, checklist generation, summary counts, filters, and age labels.

## Safety

- No Prisma migration.
- No schema changes.
- No dependency changes.
- No README changes.
- No upload, download, delete, or metadata action behavior changes.
- Uses existing `MedicalDocument` fields only.

## Checks

Run locally:

```powershell
npm install
npm run db:validate:ci
npm run actions:check
npm run actions:imports
npm run actions:shadow
npm run typecheck
npm run lint
npm run test:run
```
