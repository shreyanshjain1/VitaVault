# Phase 04G — Reminder schedule editing

This patch keeps the reminder workflow low-risk while making it more useful for day-to-day operations.

## What changed
- The reminder regeneration action now respects the selected target date.
- The reminder center now supports editing reminder schedule settings in place:
  - due date
  - due time
  - grace period minutes
  - channel
  - timezone
  - quiet hours start/end
- Reminder schedule edits reset the reminder back to an active due state and write an audit log.

## Why this phase is safe
- No schema migration.
- No Redis / BullMQ dependency.
- No queue or worker changes.
- Only reminder-facing files were touched.

## Validation
Run:

```bash
npm run typecheck
npm run build
```
