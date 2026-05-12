# Patch 60 — Report History UX Hardening

## Summary

This patch improves the report builder's saved report history workflow without changing the database schema.

## What changed

- Added saved report history filters for active, review, shared, archived, and all packets.
- Added archived packet visibility through the report builder history filter.
- Added restore support for archived saved reports.
- Added a mark-review action for packets that need another review cycle.
- Updated report history statistics to count active and archived packets separately.
- Preserved existing report opening, print preview, mark-shared, and archive workflows.
- Added helper coverage for saved report filters, status summaries, and history mapping.

## Safety

- No Prisma migration.
- No package changes.
- No README changes.
- No API route changes.
- Existing `SavedReport` fields are reused.
- Archived reports remain hidden from the default active view until the archived/all filters are selected.

## Files changed

- `app/report-builder/page.tsx`
- `app/report-builder/actions.ts`
- `lib/report-builder.ts`
- `lib/report-history.ts`
- `tests/report-history.test.ts`

## Validation

Run the standard local checks after applying the patch:

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
npm run test:run -- tests/report-history.test.ts
```
