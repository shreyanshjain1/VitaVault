# Phase 04 – Reminder Operations + Review Queue

This patch focuses on visible business-value improvements without forcing another risky schema rewrite.

## Included
- Reminder snooze action
- Reminder regeneration action
- Reminder center UX upgrade
- Review Queue page
- Dashboard operations visibility for:
  - overdue reminders
  - missed reminders
  - severe symptoms
  - abnormal labs

## Why this phase matters
This moves VitaVault away from scattered module-level data and toward operational follow-up workflows.

## Apply steps
1. Copy all files into the matching folders.
2. Run:
   - `npx prisma generate`
   - `npm run typecheck`

## Notes
- This patch does not add a new migration.
- It uses existing reminder, symptom, and lab data.
- It assumes the timeline page from the prior phase is already present.
