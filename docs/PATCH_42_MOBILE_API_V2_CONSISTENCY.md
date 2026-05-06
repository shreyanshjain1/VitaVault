# Patch 42: Mobile API v2 Consistency

## Summary

This patch aligns the mobile/device API route, docs, demo data, and validation contract so the public product story matches the actual Prisma-backed implementation.

## What changed

- Added `lib/mobile-device-api.ts` as the shared mobile API contract for supported reading types, endpoints, and payload validation.
- Updated `/api/mobile/device-readings` to use the shared validation schema instead of keeping its own local copy.
- Removed `SLEEP_MINUTES` from the supported reading table because it is not present in the current Prisma `DeviceReadingType` enum.
- Added a clear future-reading note explaining that sleep support needs a dedicated Prisma migration before clients send it.
- Normalized demo API route references to the implemented routes:
  - `/api/mobile/auth/login`
  - `/api/mobile/auth/me`
  - `/api/mobile/auth/logout`
  - `/api/mobile/connections`
  - `/api/mobile/device-readings`
- Added tests for mobile API schema-backed reading types, valid mixed payloads, unsupported sleep readings, invalid timestamps, and missing required reading values.
- Updated known limitations to reflect that mobile API documentation now exists and the remaining work is production hardening.

## Safety notes

- No Prisma schema changes.
- No migration changes.
- No package changes.
- Sleep tracking is intentionally left as a future feature instead of being added halfway through the API contract.

## Verification

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
