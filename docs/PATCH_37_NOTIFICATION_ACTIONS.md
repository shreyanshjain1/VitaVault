# Patch 37 — Notification Actions

This patch turns the Notification Center from a passive inbox into an action-oriented workflow surface.

## Added

- New `app/notifications/actions.ts` server actions.
- Acknowledge alert directly from `/notifications`.
- Resolve alert directly from `/notifications`.
- Complete reminder directly from `/notifications`.
- Snooze reminder for one hour directly from `/notifications`.
- Skip reminder directly from `/notifications`.
- Create a follow-up reminder from any notification item.
- Added source IDs and action hints to notification items.
- Updated notification cards so source navigation and actions are separate.

## Safety notes

- No Prisma migration required.
- Uses existing `AlertEvent`, `Reminder`, `AlertAuditLog`, and `ReminderAuditLog` models.
- Alert and reminder actions are scoped to the authenticated user.
- Follow-up reminders use a deterministic `dedupeKey` to avoid duplicate follow-ups for the same notification source.

## Manual checks

- `/notifications`
- Complete or snooze a due reminder.
- Acknowledge or resolve an open alert.
- Create a follow-up from a lab/document/device notification.
- Confirm `/reminders`, `/alerts`, `/dashboard`, and `/care-plan` refresh after actions.
