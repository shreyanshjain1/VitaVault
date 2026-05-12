# Patch 65 — Export Center Reliability Polish

## Summary

This patch adds a reliability layer to VitaVault's Export Center so export packets and CSV downloads are easier to review before sharing externally.

## What changed

- Added a pure export reliability classifier in `lib/export-center.ts`.
- Added a reliability signal to the Export Center data payload.
- Added a reliability signal card and checklist to `/exports`.
- Added no-store and `X-Content-Type-Options: nosniff` headers to CSV responses.
- Improved unknown export responses with the requested type and supported export type list.
- Expanded export-center tests for ready/blocked reliability states.
- Expanded export route tests for unknown-export response details and safer CSV headers.

## Safety

- No Prisma migration.
- No schema changes.
- No dependency changes.
- No README changes.
- No authenticated route behavior changes.
- No export definitions were removed.

## Validation

Recommended local checks:

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

Targeted checks:

```powershell
npm run test:run -- tests/export-center.test.ts tests/exports-route.test.ts
```
