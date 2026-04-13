# Phase 03C — Source-linked alerts and patient timeline

## Included in this patch
- Replaces placeholder alert detail implementation with real alert queries and audit history
- Makes alert status actions update actual alert records and create audit entries
- Adds source context and source-module deep links to alert list and detail screens
- Adds a new patient timeline page that merges data from:
  - appointments
  - lab results
  - vital records
  - symptom entries
  - medication logs
  - uploaded documents
  - vaccination records
  - reminders
  - alerts
- Adds dashboard shortcut to the new timeline page

## Why this phase matters
This phase makes VitaVault feel more like a connected business product instead of separate module pages.

## What should come next
- Timeline filtering by module/type/date range
- Drill-down links with row highlighting inside source modules
- Rule seeding and better alert explanation UX
- Reminder snooze and recurrence editing
