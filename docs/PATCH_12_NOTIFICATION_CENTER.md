# Patch 12 — Notification Center

## Summary

This patch adds a protected Notification Center that works as a unified inbox for VitaVault care signals.

## Files changed

- `app/notifications/page.tsx`
- `lib/notification-center.ts`
- `lib/app-routes.ts`
- `components/app-shell.tsx`

## What was added

- New `/notifications` route
- Unified inbox for:
  - open and acknowledged alerts
  - due, sent, overdue, and missed reminders
  - upcoming appointments in the next 14 days
  - abnormal and borderline labs
  - unlinked or under-documented medical documents
  - pending care-team invites
  - stale, disconnected, or errored device connections
- Priority scoring:
  - critical
  - high
  - medium
  - low
- Source filtering
- Priority filtering
- Summary cards for visible items, critical items, high-priority items, and care workload
- Recommended next-action panel
- Sidebar navigation entry

## Implementation notes

- No Prisma migration is required.
- The patch only reads existing models.
- It intentionally avoids schema changes, background workers, or destructive notification acknowledgement actions.
- The route links back to the existing source workflows instead of creating duplicate state.

## Manual checks

Visit:

- `/notifications`
- `/notifications?source=ALERT`
- `/notifications?source=REMINDER`
- `/notifications?priority=high`
- `/notifications?priority=medium`

Run:

```bash
npm run lint
npm run typecheck
npm run test:run
```
