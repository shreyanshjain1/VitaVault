# Patch 35 — Patient Timeline v2

## Summary

This patch upgrades VitaVault's patient timeline into a stronger longitudinal health history workspace.

## Added

- Filterable `/timeline` workspace
- Search across timeline title, description, source, type, tone, and risk level
- Record type filter
- Tone/status filter
- Date range filters
- Month-grouped timeline sections
- Month index sidebar
- Risk markers for urgent and watch items
- Timeline summary cards
- Print-ready `/timeline/print` route
- Filter-aware print timeline packet

## Sources included

- Appointments
- Lab results
- Vitals
- Symptoms
- Vaccinations
- Documents
- Reminders
- Alerts

## Notes

- No Prisma migration required.
- Existing `getTimelineItems()` behavior remains compatible while adding richer metadata.
- The print route reuses the same filters as the main timeline page.
