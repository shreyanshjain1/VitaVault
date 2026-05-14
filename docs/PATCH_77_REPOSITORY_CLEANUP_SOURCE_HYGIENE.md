# Patch 77 — Repository Cleanup and Source Hygiene

## Goal

Clean up stale root-level duplicate source files and strengthen the existing repository hygiene check so the project stays easier to review and maintain.

## Why this patch exists

The latest VitaVault base still had two root-level TypeScript files that duplicated real source modules:

- `actions.ts` duplicated the care-team server action area, but it was stale compared with `app/care-team/actions.ts`.
- `invite-email.ts` duplicated `lib/invite-email.ts`.

Those files can confuse reviewers because root-level app actions and helpers look like active source code even when the application imports the canonical files from `app/` and `lib/`.

## Changes

- Extended `scripts/repo-hygiene-check.cjs` to fail when stale root duplicate source files are present.
- Added `scripts/cleanup-root-duplicates.cjs` to safely remove known stale root duplicates only when the canonical source files exist.
- Kept canonical files untouched:
  - `app/care-team/actions.ts`
  - `lib/invite-email.ts`

## Cleanup command

Run this once after applying the patch:

```powershell
node scripts/cleanup-root-duplicates.cjs
node scripts/repo-hygiene-check.cjs
```

The cleanup script removes:

```txt
actions.ts
invite-email.ts
```

## Safety notes

- No Prisma migration.
- No schema changes.
- No package changes.
- No README changes.
- No runtime behavior changes.
- The cleanup only targets known stale root duplicates and refuses to delete them if their canonical files are missing.

## Validation

Recommended checks:

```powershell
node scripts/cleanup-root-duplicates.cjs
node scripts/repo-hygiene-check.cjs
npm run db:validate:ci
npm run actions:check
npm run actions:imports
npm run actions:shadow
npm run typecheck
npm run lint
npm run test:run
```
