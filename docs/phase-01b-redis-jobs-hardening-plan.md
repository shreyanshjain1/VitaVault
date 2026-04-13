# Phase 01B - Redis and Jobs Hardening

## Goal
Reduce Vercel and runtime deployment risk by making BullMQ and Redis usage lazy instead of eager.

## Changes in this patch
- Remove eager queue instantiation from `lib/jobs/queues.ts`
- Add a reusable `hasRedisConfig()` helper
- Make BullMQ Redis creation lazy in `lib/jobs/redis.ts`
- Return degraded dashboard data from `lib/jobs/dashboard.ts` when Redis is unavailable
- Disable manual job dispatch UI when Redis is unavailable
- Return a clean `503` from `/api/jobs/dispatch` when Redis is not configured

## Why this comes before new features
The jobs layer was one of the highest deployment-risk areas because importing a module could trigger Redis-dependent code too early.

## Validation
Run these after pasting the patch:

```bash
npm run typecheck
npm run build
```

Then redeploy on Vercel.
