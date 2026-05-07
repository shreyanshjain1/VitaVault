# Patch 44 Hotfix: Export Center Partial Mock Safety

## Summary

Patch 44 connected Care Notes into the Export Center, but the existing export-center unit tests use a partial mocked Prisma client that did not include the `careNote` delegate.

This hotfix keeps Care Notes enabled in the real app while making `getExportCenterData()` tolerate partial mocked Prisma clients during unit tests.

## Changes

- Added a small optional delegate helper for `db.careNote`.
- Counts care notes only when the delegate exists.
- Preserves existing export-center test expectations when the mocked Prisma client does not include `careNote`.
- Keeps the Care-team notes packet visible in real app/runtime contexts where the Prisma client has the `careNote` delegate.

## Safety

- No Prisma schema changes.
- No migration changes.
- No package changes.
- No UI changes.
- Fixes test isolation only.

## Checks

Run:

```bash
npm run db:validate:ci
npm run actions:check
npm run actions:imports
npm run actions:shadow
npm run typecheck
npm run lint
npm run test:run
```
