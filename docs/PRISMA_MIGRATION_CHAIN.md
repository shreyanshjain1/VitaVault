# Prisma Migration Chain

This document explains the current VitaVault Prisma migration history so future schema changes can be reviewed safely without rewriting applied migrations.

## Why this exists

VitaVault has a long migration chain that includes a consolidated baseline migration, intentional no-op migrations, and one migration folder whose name no longer matches the SQL inside it. The project can still be valid, but the history is easy to misread during reviews.

Use this file as the migration map before adding new Prisma schema changes.

## Current migration order

| Order | Migration folder | Purpose | Notes |
| ---: | --- | --- | --- |
| 1 | `0_init` | Baseline schema | Creates the main user, health record, care-team, AI insight, mobile/device, export, and audit foundations. |
| 2 | `20260317015224_add_care_team_and_ai_insights` | History compatibility no-op | Retained so Prisma migration history stays ordered after the baseline absorbed these objects. Do not re-add duplicate enum/table SQL here. |
| 3 | `20260318045951_init` | History compatibility no-op | Retained because the device/mobile sync schema already exists in `0_init`. Reintroducing SQL here can trigger duplicate enum/table failures in shadow validation. |
| 4 | `20260318053758_add_job_run_models` | Background job observability | Adds `JobKind`, `JobRunStatus`, `JobRun`, and `JobRunLog`. |
| 5 | `20260318064201_add_threshold_alert_engine` | Alert engine | Adds alert rule/event/audit enums, tables, indexes, and relations. |
| 6 | `20260423040000_add_document_record_links` | Document linking | Adds `DocumentLinkType` and document record-link columns/indexes. |
| 7 | `20260424160000_add_user_deactivation_controls` | Account lifecycle | Adds user deactivation metadata. |
| 8 | `20260505000000_add_care_notes` | Care-team notes | Adds `CareNoteCategory`, `CareNotePriority`, `CareNoteVisibility`, `CareNote`, indexes, and relations. |
| 9 | `20260505051910_add_care_notes` | Reminder lifecycle and audit logging | The folder name is misleading. The SQL adds reminder lifecycle enums/fields and `ReminderAuditLog`, not care notes. Do not rename after it has been applied to shared databases. |
| 10 | `20260506034730_migration_safety` | Reminder timestamp safety | Adjusts the `Reminder.updatedAt` default behavior after the reminder lifecycle migration. |
| 11 | `20260508093000_add_saved_report_history` | Saved report history | Adds `SavedReportStatus`, `SavedReport`, indexes, and report history relations. |

## Known migration quirks

### Consolidated baseline

`0_init` is the real baseline. It already contains many models that were originally developed across separate feature patches.

Because of that, some later migration folders are intentionally no-op compatibility folders. They should remain present so Prisma migration history stays stable.

### Intentional no-op migrations

These migration files are intentionally blank or comment-only:

- `20260317015224_add_care_team_and_ai_insights/migration.sql`
- `20260318045951_init/migration.sql`

They prevent duplicate `CREATE TYPE` and `CREATE TABLE` operations after the schema was consolidated into `0_init`.

### Misleading folder name

`20260505051910_add_care_notes` does not add care notes. It adds reminder lifecycle support, reminder channels, reminder state fields, dedupe fields, indexes, and `ReminderAuditLog`.

Leave the folder name unchanged if it has already been applied anywhere. Renaming an applied Prisma migration folder can desynchronize local, staging, or production migration history.

## Safe migration rules for VitaVault

1. Do not edit or rename applied migration folders casually.
2. Do not reintroduce SQL into intentional no-op migrations.
3. Prefer additive migrations for new columns, tables, enums, and indexes.
4. Avoid destructive migrations unless a backup/rollback plan exists.
5. If an enum must be expanded, add the enum value through a dedicated Prisma migration and update docs/tests/API contracts in the same patch.
6. If an enum value is removed, treat it as a breaking migration and audit existing rows first.
7. Keep schema changes separate from UI-only or docs-only patches.
8. Run shadow validation before committing migration changes.

## Recommended local checks

Run these before opening a PR that touches `prisma/schema.prisma` or `prisma/migrations`:

```powershell
npm install
npm run db:validate:ci
npx prisma generate
npm run typecheck
npm run lint
npm run test:run
```

For migration-specific validation during active schema work:

```powershell
npx prisma validate
npx prisma migrate status
```

If you are testing against a disposable local database only, you may use:

```powershell
npx prisma migrate reset
```

Do not run `migrate reset` against a database that contains real or shared data.

## When to use `db push`

Use `prisma db push` only for quick disposable local prototyping. Do not use it as the normal workflow for this repository because it bypasses the migration history that reviewers and deployment environments need.

For committed project changes, prefer:

```powershell
npx prisma migrate dev --name descriptive_change_name
```

Then commit both:

- `prisma/schema.prisma`
- the generated folder inside `prisma/migrations/`

## Reviewer checklist

Before approving a schema PR, confirm:

- The migration name matches the actual SQL purpose.
- The generated SQL does not duplicate an enum/table already created by `0_init`.
- The migration is additive unless the PR clearly explains data-loss risk.
- Any new enum values are reflected in SDK examples, OpenAPI/Postman exports, docs, and tests.
- `npm run db:validate:ci` passes.
- `npm run typecheck` passes after `prisma generate`.
- Tests using partial mocked Prisma clients still pass.

## Current recommendation

The current migration chain should be left intact. The only cleanup needed is documentation clarity. Future database changes should be added as new migrations rather than rewriting historical folders.
