Phase 03D includes:
- Fix alert schema/query/UI mismatch against the real Prisma migration shape
- Add real alert detail, audit trail, and status transitions
- Add alert rule CRUD page
- Add unified patient timeline page
- Add reminder snooze and regenerate actions
- Surface open alerts on dashboard

Important cleanup after applying this patch:
- delete any stray phase03_patch folder from the repo root before running typecheck
- run npx prisma generate after prisma/schema.prisma changes
