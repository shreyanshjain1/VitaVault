# Patch 26B — Storage Typecheck Fix

This hotfix cleans up Patch 26 validation issues.

## Changes

- Updates the protected document download route to pass an `ArrayBuffer` body into `NextResponse` instead of a Node `Buffer`, fixing TypeScript compatibility with `BodyInit`.
- Removes unused Prisma enum imports from `lib/device-sync-simulator.ts`.
- Keeps the document storage abstraction behavior intact.
- Requires no Prisma migration.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run test:run
```
