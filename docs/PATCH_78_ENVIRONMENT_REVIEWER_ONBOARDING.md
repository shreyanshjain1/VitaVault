# Patch 78 — Environment Setup and Reviewer Onboarding Hardening

## Summary

This patch refreshes VitaVault's environment setup documentation so fresh reviewers and deployment environments can understand which variables are required, recommended, or optional.

## Changes

- Updated `.env.example` with the current app environment surface.
- Added `NEXT_PUBLIC_APP_URL`, `VITAVAULT_DEMO_MODE`, `NEXT_PUBLIC_DEMO_MODE`, `SKIP_REDIS_DURING_BUILD`, `S3_PUBLIC_BASE_URL`, and `R2_PUBLIC_BASE_URL` to the template.
- Added `docs/ENVIRONMENT.md` with local, reviewer/demo, Vercel, storage, Redis, AI, email, and validation guidance.
- Kept secrets as placeholders or empty strings only.

## Safety

- No Prisma migration.
- No schema changes.
- No package changes.
- No runtime behavior changes.
- No README changes.
- No real secrets added.

## Suggested validation

```powershell
npm install
npm run db:validate:ci
npm run actions:check
npm run actions:imports
npm run actions:shadow
npm run typecheck
npm run lint
npm run test:run
```
