# Patch 38 — Report Builder

This patch adds a custom report builder to VitaVault so users can assemble print-ready packets without adding a new database table.

## Added

- New protected `/report-builder` workspace
- New print-ready `/report-builder/print` route
- Shared report data helper at `lib/report-builder.ts`
- Report type presets:
  - Patient summary
  - Doctor visit
  - Emergency handoff
  - Care-team review
  - Custom packet
- Section selector for:
  - Profile
  - Medications
  - Vitals
  - Labs
  - Symptoms
  - Appointments
  - Documents
  - Alerts
  - Care Team
  - AI Insights
  - Timeline
- Date range controls
- Readiness scoring
- Pre-share action queue
- Recent report timeline preview
- Sidebar navigation entry under Sharing & Reports

## Notes

- No Prisma migration is required.
- The builder reuses existing records and print/report workflows.
- The print route supports query-string driven report type, section selection, and date filtering.
