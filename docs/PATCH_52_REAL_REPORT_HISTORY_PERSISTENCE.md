# Patch 52: Real Report History Persistence

Patch 52 converts Report Builder's previously generated-only history cards into persisted saved report records.

## Added

- `SavedReport` Prisma model.
- `SavedReportStatus` enum.
- Safe migration folder: `20260508093000_add_saved_report_history`.
- Save-current-packet server action from `/report-builder`.
- Mark-as-shared and archive actions for saved reports.
- Audit log entries for saved report creation, sharing, and archive events.
- Saved report statistics in the Report Builder page.
- Pure report-history helper tests.

## Safety notes

- This patch adds a new table only.
- It does not change existing report, export, health-record, or care-team tables.
- It does not delete generated report signals; those remain visible as live packet signals.
- `archiveSavedReportAction` preserves the record and hides it from the active saved history list.

## Migration commands

For local development:

```bash
npx prisma migrate dev
```

For production-style deployment after review:

```bash
npx prisma migrate deploy
```

Do not run `npx prisma migrate reset` against any database you care about.
