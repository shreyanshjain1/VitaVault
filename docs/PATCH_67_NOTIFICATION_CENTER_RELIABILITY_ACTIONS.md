# Patch 67: Notification Center Reliability Actions

## Summary

This patch improves VitaVault's Notification Center with clearer workflow-state classification, action labels, stale cleanup signals, and regression coverage for notification follow-through behavior.

## What changed

- Added reusable notification reliability helpers in `lib/notification-center.ts`.
- Classified notification items into workflow states:
  - Urgent
  - Due now
  - Follow-up
  - Stale
  - Scheduled
  - Needs review
- Added source-specific action labels for alerts, reminders, appointments, labs, documents, care-team invites, and device sync issues.
- Added stale/follow-up cleanup guidance so the inbox can be reviewed like an operational queue.
- Added reliability summary counts to Notification Center data.
- Added workflow-state filtering on `/notifications`.
- Updated notification cards with action and cleanup guidance.
- Added regression tests for reliability state classification, summary counts, action labels, and state filtering.

## Safety notes

- No Prisma migration.
- No schema changes.
- No dependency changes.
- No README changes.
- No notification persistence model was added.
- Existing alert/reminder actions remain unchanged.
- The patch uses existing generated notification sources and classifies them in memory.

## Suggested local checks

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
npm run test:run -- tests/notification-center.test.ts
```
