# Patch 62 — Device Connection Reliability Panel

## Summary

Adds an operational reliability layer to the Device Integrations workspace without changing the database schema. The patch makes device freshness, blocked syncs, stale connections, paused devices, and first-sync status visible from both the list and detail pages.

## Files changed

- `lib/device-integrations.ts`
- `app/device-connection/page.tsx`
- `app/device-connection/[id]/page.tsx`
- `tests/device-integrations.test.ts`

## What changed

- Added schema-safe device reliability helpers:
  - `buildDeviceReliabilitySignal()`
  - `buildConnectionReliabilitySummary()`
- Added freshness thresholds:
  - 24 hours: sync due
  - 72 hours: stale sync
- Added dashboard reliability summary counts for:
  - Current
  - Sync due
  - Stale
  - Blocked
  - Paused
  - Awaiting first sync
  - Revoked
  - Needs review
- Added reliability badges and next-step guidance to each connection card.
- Added a detail-page reliability panel with freshness and remediation guidance.
- Added regression tests for reliability classification and summary counts.

## Safety notes

- No Prisma migration.
- No dependency changes.
- No README changes.
- No API behavior changes.
- No server action behavior changes.
- Uses existing `DeviceConnection` fields only: status, last sync, and last error.

## Validation

Run:

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

Targeted test:

```powershell
npm run test:run -- tests/device-integrations.test.ts
```
