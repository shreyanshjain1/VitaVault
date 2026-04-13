# Phase 01D — Build-Safe Redis Hardening

## Goal
Stop noisy Redis connection attempts during `next build` / page data collection while preserving queue-backed behavior at runtime.

## What changed
- Added `hasRedisConfig()` and `shouldSkipRedisDuringBuild()` helpers.
- Removed eager BullMQ queue instantiation exports from `lib/jobs/queues.ts`.
- Made jobs dashboard return a degraded state instead of touching Redis during build.
- Disabled manual dispatch UI when jobs are unavailable.
- Returned a clean `503` from the dispatch API when Redis is unavailable.

## Why this phase matters
The build logs showed repeated `ECONNREFUSED 127.0.0.1:6379` during page-data collection even though the build completed. This means the app was still touching Redis while rendering build-time data. This patch removes that build-time pressure without changing the worker contract.
