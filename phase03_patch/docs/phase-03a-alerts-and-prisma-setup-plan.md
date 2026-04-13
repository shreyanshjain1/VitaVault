# Phase 03A — Alert workflow + Prisma setup hardening

## Included in this patch
- Restores the Prisma alert models that already existed in SQL migrations but were missing from `schema.prisma`
- Reconnects the alert center to live Prisma queries
- Replaces the alert detail placeholder with a real detail page
- Adds alert status actions with audit logging
- Surfaces open alerts on the dashboard again
- Adds a safer local `db:validate` wrapper that explains missing `.env` / `DATABASE_URL`
- Updates CI to validate Prisma with a placeholder DATABASE_URL before typecheck

## Why this came before the next feature batch
The repo had a mismatch between:
- Prisma migration history
- Prisma schema
- alert UI pages

That mismatch blocked real alert work and also made setup less predictable.

## After applying this patch
Run:

```bash
copy .env.example .env
npm install
npm run db:validate
npx prisma generate
npm run typecheck
```

## Next recommended phase
Phase 03B:
- alert rule CRUD UI
- rule creation/editing forms
- seeded default rules
- source-linked deep links from alerts into vitals, symptoms, medication logs, and sync jobs
