# Patch 19 — Symptom Review Hub

## Summary
Adds a focused symptom review workspace for unresolved symptom tracking, severity pressure, body-area clustering, and provider handoff preparation.

## Files changed

- `app/symptom-review/page.tsx`
- `lib/symptom-review.ts`
- `lib/app-routes.ts`

## Product value

This patch turns symptom entries into a practical review surface instead of only a journal list. It helps users identify severe unresolved symptoms, missing notes, repeated body-area clusters, symptom-related alerts, and follow-up reminders before a doctor visit or care-team handoff.

## Added

- Protected `/symptom-review` page
- Symptom readiness score
- Recent severity breakdown
- Unresolved symptom and severe-open metrics
- Documentation coverage score
- Body-area cluster cards
- Recommended symptom action queue
- Search, severity, and status filters
- Symptom register timeline
- Care handoff signal panel
- Provider review note panel
- Sidebar navigation entry

## Database impact

No Prisma migration required. The feature reuses existing `SymptomEntry`, `AlertEvent`, and `Reminder` records.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run test:run
```
