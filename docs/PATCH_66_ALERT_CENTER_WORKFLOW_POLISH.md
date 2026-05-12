# Patch 66 — Alert Center Workflow Polish

## Summary

This patch improves VitaVault's Alert Center by adding a clearer triage workflow layer around existing alert events.

## Changes

- Added shared alert workflow helpers in `lib/alerts/workflow.ts`.
- Added triage states for urgent, needs review, in review, resolved, and dismissed alerts.
- Added care-team visibility signals for owner-only, care-team visible, and closed-history alerts.
- Added alert workflow summary counts to `/alerts`.
- Updated alert list cards with triage labels, visibility labels, age labels, and next-step guidance.
- Updated alert detail pages with a workflow signal panel and triage checklist.
- Added regression tests for alert workflow classification, visibility, summaries, display cards, and age labels.

## Safety

- No Prisma migration.
- No schema changes.
- No package changes.
- No README changes.
- No API route changes.
- No alert action behavior changes.
- Uses existing `AlertEvent` fields only.

## Verification

Run locally:

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
npm run test:run -- tests/alert-workflow.test.ts
```
