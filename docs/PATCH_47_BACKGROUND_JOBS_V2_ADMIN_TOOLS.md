# Patch 47: Background Jobs v2 Admin Tools

## Summary

Patch 47 upgrades VitaVault's Background Jobs area from a mostly observational dashboard into an admin operations surface for reviewing persisted job runs, filtering failures, retrying failed work, acknowledging operational review, and marking queued/active/retrying persisted runs as cancelled.

## What changed

- Added admin-only job-run retry, acknowledge, and cancel server actions.
- Added filtered job-run review by status, job kind, failure review, device-sync review, and free-text query.
- Added job-run input/result JSON previews for operational debugging.
- Added persisted job-run links back to device connections or sync jobs when available.
- Added summary KPIs for total persisted runs, failed/retrying runs, in-flight runs, and recent failure rate.
- Hardened `/api/jobs/dispatch` so manual job dispatch is admin-only.
- Preserved `connectionId` and `syncJobId` on newly queued device-sync job runs.
- Added pure helper tests for job admin filter parsing, retry payload construction, retry/cancel eligibility, summaries, and deep links.

## Safety notes

- No Prisma schema changes.
- No migration changes.
- No package changes.
- Cancelling a job run marks the persisted VitaVault `JobRun` record as `CANCELLED`; it does not remove a live BullMQ job from Redis.
- Retrying uses the original persisted input payload and queues a new job run when Redis is configured.

## Checks

Run:

```bash
npm run db:validate:ci
npm run actions:check
npm run actions:imports
npm run actions:shadow
npm run typecheck
npm run lint
npm run test:run
```
