# Patch 72 — Symptom Review Pattern Detection Polish

## Summary

This patch improves the Symptom Review Hub with stronger pattern-detection signals for recurring, worsening, stale, and resolved symptom histories.

## Changes

- Added symptom cadence labels so repeated symptoms show whether they happened in a tight cluster or across a wider period.
- Added severity trails so reviewers can see how a pattern moved over time.
- Added dominant trigger detection from repeated trigger values.
- Added per-pattern review checklists for provider handoff, trigger capture, missing notes, stale open symptoms, and resolved context.
- Expanded pattern summary counts with high-severity, action-required, and stable pattern totals.
- Updated `/symptom-review` pattern cards with cadence, trigger, severity trail, and checklist details.
- Expanded symptom review tests for cadence, trigger detection, severity trails, checklist output, and summary counts.

## Safety

- No Prisma migration.
- No schema changes.
- No package changes.
- No README changes.
- No API route changes.
- Uses existing `SymptomEntry`, alert, and reminder data only.

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
npm run test:run -- tests/symptom-review.test.ts
```
