# Phase 04F — Admin Ops / Health Monitoring

## Goal
Add a business-friendly operations view that surfaces deployment readiness, unresolved clinical pressure, job failures, sync failures, and environment health without depending on Redis queue access during build.

## Why this phase now
- High business/demo value
- Low infrastructure risk compared with deeper worker changes
- Helps future debugging and deployment verification
- Reuses existing data models rather than introducing new schema changes

## Added routes and modules
- `/ops`
- `lib/ops-health.ts`

## What this phase shows
- Environment readiness snapshot
- Open alerts and reminder pressure
- Severe symptom and flagged lab load
- Failed worker runs
- Failed device sync jobs
- Care access relationship count

## Notes
- This page is intentionally read-only
- It uses existing Prisma models only
- It does not add migrations
- It avoids direct queue interaction so it stays safer for builds and Vercel deployment
