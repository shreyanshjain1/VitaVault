# Patch 15 — Medication Safety Hub

## Summary

This patch adds a medication-focused safety workspace that turns the existing medication, schedule, adherence-log, reminder, alert, and doctor data into a practical review surface.

## Files changed

- `app/medication-safety/page.tsx`
- `lib/medication-safety.ts`
- `lib/app-routes.ts`
- `docs/PATCH_15_MEDICATION_SAFETY.md`

## What was added

- Protected `/medication-safety` page
- Medication safety readiness score
- Today dose board for scheduled active medications
- 30-day adherence signal
- Missed/skipped dose percentage
- Active medication cards with schedule count, provider context, end-date review, and adherence signal
- Safety action queue for:
  - high-risk medication alerts
  - active medications past their end date
  - medications with no schedule times
  - medications ending in the next 30 days
  - medications without a linked doctor/provider
- Medication reminder panel
- Open medication alert panel
- Sidebar navigation entry

## Safety notes

- No Prisma migration is required.
- No medication advice is generated.
- The feature only summarizes existing records and workflow gaps.
- The page includes a disclaimer that it is not a substitute for professional medical advice.

## Validation checklist

Run:

```bash
npm run lint
npm run typecheck
npm run test:run
```

Manual route:

```txt
/medication-safety
```
