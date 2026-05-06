# Patch 43: Report Builder Presets + History Polish

## Summary

Patch 43 improves the Report Builder experience without adding database tables or Prisma migrations. The report surface now has scenario-based presets, cleaner generated links, and a lightweight packet history panel based on the current report draft and source events.

## What changed

- Added `lib/report-builder-presets.ts` as a pure, testable report preset contract.
- Added presets for:
  - Doctor visit packet
  - Emergency handoff
  - Care-team weekly review
  - Medication review
  - Lab follow-up
- Updated `/report-builder` to show preset cards above manual controls.
- Presets now generate report type, section selection, and date ranges through query parameters.
- Added a recent packet history panel for:
  - current draft
  - latest source event
  - pre-share checks
- Updated `/report-builder/print` to preserve preset context and display the selected preset label.
- Added unit tests for preset resolution, generated links, override behavior, and invalid preset handling.

## Safety notes

- No Prisma schema changes.
- No migration changes.
- No package changes.
- The packet history is computed from current report data and does not create a persistence requirement.
- Presets are query-driven, so they are safe for demo, portfolio, and local review flows.

## Checks

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

## Future upgrade path

A later patch can add persistent saved reports with a proper Prisma model if VitaVault needs real report history, share links, or export audit retention.
