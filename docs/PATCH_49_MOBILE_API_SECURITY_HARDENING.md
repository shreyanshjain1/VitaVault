# Patch 49: Mobile API Security Hardening

Patch 49 strengthens VitaVault's mobile/device API foundation without changing the Prisma schema, migrations, packages, or the public reading contract.

## What changed

- Added `lib/mobile-api-security.ts` for reusable mobile endpoint hardening helpers.
- Added endpoint-specific rate limits for:
  - mobile login
  - mobile session check
  - mobile logout
  - device connection listing
  - device reading sync
- Added `Cache-Control: no-store` and `X-Content-Type-Options: nosniff` headers to mobile API responses.
- Added Content-Length based payload-size protection for mobile login and device reading sync.
- Added access audit events for mobile session creation and revocation.
- Updated mobile logout so invalid/expired tokens return an unauthorized response instead of silently succeeding.
- Updated API docs and Device Integration QA checklist to reflect the now-implemented security controls.
- Added `tests/mobile-api-security.test.ts` for the new security helper layer.

## Safety notes

- No Prisma schema changes.
- No migration changes.
- No package changes.
- No Redis/BullMQ dependency added.
- Rate limiting still uses the existing in-memory helper, so production-scale deployments should move this to Redis or managed edge storage later.
- Reading validation remains schema-backed through `mobileDeviceSyncSchema`.

## Checks to run

```bash
npm run db:validate:ci
npm run actions:check
npm run actions:imports
npm run actions:shadow
npm run typecheck
npm run lint
npm run test:run
```
