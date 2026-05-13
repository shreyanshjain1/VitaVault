# Patch 72 Hotfix — Symptom Pattern Date Handling

## Summary

This hotfix corrects the symptom pattern cadence helper and tightens the related regression test data.

## Changes

- Fixed `getSymptomCadenceLabel()` so it passes `startedAt` dates into `daysBetween()` instead of full symptom entries.
- Updated the checklist regression test to use empty strings for missing notes/triggers, matching the helper's blank-field detection.

## Safety

- No Prisma migration.
- No schema changes.
- No package changes.
- No README changes.
- No runtime behavior change outside the symptom cadence bug fix.

## Recommended checks

```powershell
npm run typecheck
npm run lint
npm run test:run -- tests/symptom-review.test.ts
npm run test:run
```
