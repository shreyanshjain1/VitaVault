# Patch 73 — AI Insights Review Queue Polish

## Summary

This patch improves VitaVault's AI Insights workspace with clearer review states, source-backed trust signals, and clinician-review guidance.

## Changes

- Added AI review states for source-backed, needs-review, stale, draft, and blocked insight flows.
- Added reusable AI review queue helpers in `lib/ai-insights-workspace.ts`.
- Added a trust checklist for source coverage, readiness, risk review, data gaps, clinical boundaries, and AI provider mode.
- Added review queue summary counts to the AI workspace payload.
- Added an AI Review Queue panel to `/ai-insights`.
- Added a Review Queue metric card to the AI Insights page header stats.
- Added helper tests for review-state classification, stale insights, trust checklist output, and queue summaries.

## Safety

- No Prisma migration.
- No schema changes.
- No package changes.
- No README changes.
- No AI generation behavior changes.
- No prompt/provider changes.
- Existing AI insight history and source citation behavior remain compatible.

## Validation

Run locally:

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

Targeted test:

```powershell
npm run test:run -- tests/ai-insights-workspace.test.ts
```
