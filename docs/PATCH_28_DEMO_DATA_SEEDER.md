# Patch 28 — Demo Data Seeder v2

## Summary

Adds a richer local demo data seeder for reviewer-friendly VitaVault demos.

## Changes

- Adds `prisma/demo-seed.ts`
- Adds `npm run seed:demo`
- Adds `docs/DEMO_DATA_SEED.md`
- Creates demo accounts across patient, caregiver, doctor, lab staff, and admin roles
- Seeds realistic demo data across records, monitoring, care-team, alerts, reminders, device sync, jobs, documents, AI insights, and audit logs
- Keeps the seed idempotent by deleting only known demo accounts before recreating them
- Requires no Prisma migration

## Demo password

```txt
demo12345
```

## Recommended validation

```bash
npm run lint
npm run typecheck
npm run test:run
npm run seed:demo
```
