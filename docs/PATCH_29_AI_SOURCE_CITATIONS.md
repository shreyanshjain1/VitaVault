# Patch 29 — AI Insights v3 Source Citations

## Summary

This patch upgrades the AI Insights workspace with visible evidence cards, confidence metrics, and data-gap guidance so AI outputs feel more traceable and review-ready.

## Changes

- Adds visible source citation cards for recent medications, labs, vitals, symptoms, documents, appointments, and alerts.
- Adds AI confidence metrics for source coverage, citation pool size, open risk context, and data gaps.
- Adds data-gap recommendations to improve future AI summaries.
- Adds richer prompt transparency around what records can and cannot support generated summaries.
- Fixes duplicate Labs evidence metadata in the AI workspace helper.
- Preserves the existing AI generation action and fallback behavior.

## Files changed

- `app/ai-insights/page.tsx`
- `lib/ai-insights-workspace.ts`

## Notes

This patch uses existing schema models only and does not require a Prisma migration.
