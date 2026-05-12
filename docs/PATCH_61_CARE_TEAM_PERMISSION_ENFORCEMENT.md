# Patch 61 — Care Team Permission Enforcement Audit

## Summary

This patch centralizes VitaVault care-team permission checks so shared patient workflows use one consistent permission matrix instead of repeating flag logic in multiple places.

## What changed

- Added `lib/care-permissions.ts` with shared permission helpers.
- Updated `requireOwnerAccess()` to use the shared permission evaluator.
- Updated care-team invite/update flows so advanced permissions imply view access before they are saved.
- Updated caregiver workspace permission cards to use the shared permission matrix.
- Added `tests/care-permissions.test.ts` for owner access, view dependency, scoped permission mapping, grant normalization, and workflow audit coverage.

## Safety

- No Prisma migration.
- No package changes.
- No README changes.
- No route changes.
- No database schema changes.
- Existing permission booleans are reused.

## Notes

Scoped permissions such as edit, notes, export, and AI now depend on view access. This keeps care-team records consistent because a caregiver should not be able to act on a shared patient record they cannot view.

## Recommended checks

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
npm run test:run -- tests/care-permissions.test.ts
```
