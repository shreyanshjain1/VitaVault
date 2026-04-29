# Patch 11B — Admin/Ops Lint Hotfix

This hotfix cleans up lint failures found after Patch 11.

## Fixes

- Restores the `AuditCard` helper used by the admin audit feed.
- Restores the `ClipboardList` icon import used in the Patch 11 admin polish note.
- Removes unused imports from API docs, demo AI insights, caregiver workspace, and dashboard files.
- Keeps the Patch 11 admin dashboard data layer intact so admin metrics, role mix, and operational risks still work.

## Verification

Run:

```bash
npm run lint
npm run typecheck
npm run test:run
```

This patch does not require a Prisma migration.
