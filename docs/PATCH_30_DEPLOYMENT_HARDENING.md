# Patch 30 — Deployment Hardening

## Summary

This patch adds deployment-readiness checks, a health endpoint, environment validation scripts, and production deployment documentation.

## Added

- `/api/health` runtime health endpoint
- `lib/deployment-readiness.ts`
- `scripts/validate-env.cjs`
- `scripts/check-health-endpoint.cjs`
- `npm run env:check`
- `npm run deploy:check`
- `npm run health:local`
- `docs/DEPLOYMENT_CHECKLIST.md`
- updated `.env.example`

## Why it matters

VitaVault now has many production-style features: Auth.js, Prisma/PostgreSQL, Redis/BullMQ workers, email workflows, AI insights, document storage, mobile/device ingestion, admin/ops, and report generation. This patch gives reviewers and future deployers a single clear path to validate required configuration and runtime health.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run deploy:check
```

When environment variables are configured locally, also run:

```bash
npm run env:check
npm run health:local
```

## Migration

No Prisma migration is required.
