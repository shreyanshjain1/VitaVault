# Patch 75 Hotfix — Audit Test Fixture Types

## Summary

This hotfix resolves a TypeScript-only issue in `tests/audit-log.test.ts`.

The audit review summary helper intentionally accepts a narrow display-only event shape. The test fixture was spreading `baseEvent` and overriding `id` on inline objects, but `id` is not part of the helper's accepted `Pick<SecurityAuditEvent, ...>` input type.

## Changes

- Removed unnecessary `id` overrides from inline audit summary test fixtures.
- Kept runtime test behavior unchanged.
- No production code changes.

## Safety

- No Prisma migration.
- No schema changes.
- No package changes.
- No README changes.
- No runtime behavior changes.
- Test-only type cleanup.
