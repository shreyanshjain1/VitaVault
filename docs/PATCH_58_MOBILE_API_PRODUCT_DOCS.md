# Patch 58 — Mobile API Product Documentation Cleanup

## Summary

This patch converts the mobile/device API documentation into cleaner product-facing documentation for reviewers, QA testers, and future mobile client work.

## Files changed

- `docs/MOBILE_DEVICE_API.md`

## What changed

- Removed patch-history wording from the mobile API guide.
- Reorganized the document around product usage, authentication, endpoints, supported contract values, security notes, exports, provider connectors, SDK examples, and reviewer smoke testing.
- Added explicit tables for schema-backed reading sources, device platforms, connection statuses, and reading types.
- Preserved the current supported mobile route names and example payloads.
- Kept unsupported values such as `SLEEP_MINUTES` clearly marked as not part of the current request contract.

## Safety notes

- No Prisma migration.
- No dependency changes.
- No runtime code changes.
- No route behavior changes.
- No README changes.
- This is documentation-only and safe to apply on top of the existing mobile API implementation.

## Validation

Recommended checks:

```powershell
npm run lint
npm run typecheck
npm run test:run
```
