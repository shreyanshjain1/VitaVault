# Patch 42 Hotfix: Mobile API Test Fixture Alignment

## Summary

This hotfix aligns the Patch 42 mobile API contract test fixture with the actual Prisma `ReadingSource` enum values in the current VitaVault schema.

## Fixed

- Replaced the invalid test-only enum reference `ReadingSource.MOBILE_APP` with `ReadingSource.ANDROID_HEALTH_CONNECT`.
- Keeps Patch 42 behavior unchanged.
- No Prisma schema changes.
- No migration changes.
- No package changes.

## Why

The current Prisma schema supports these reading sources: `MANUAL`, `ANDROID_HEALTH_CONNECT`, `APPLE_HEALTH`, `FITBIT`, `SMART_BP_MONITOR`, `SMART_SCALE`, `PULSE_OXIMETER`, and `OTHER`. `MOBILE_APP` does not exist, so TypeScript and Vitest correctly failed on the new Patch 42 test file.

## Checks

Run:

```bash
npm run typecheck
npm run lint
npm run test:run
```
