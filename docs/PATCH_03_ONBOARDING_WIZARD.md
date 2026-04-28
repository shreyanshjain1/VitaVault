# Patch 03 — First-Time Onboarding Wizard

## Purpose

This patch adds a first-run onboarding experience that turns the existing health-profile form into a more guided product workflow.

## What changed

- Added `/onboarding` as a protected authenticated page.
- Added a guided setup layout with readiness scoring and checklist groups.
- Added onboarding server actions for saving profile setup and skipping setup.
- Reused the existing `HealthProfile` model, so no Prisma migration is required.
- Added shared onboarding helpers for progress calculation and date formatting.
- Updated signup so new users land on `/onboarding` by default when no callback URL is provided.
- Added Onboarding to the app shell navigation.

## Files changed

- `app/onboarding/page.tsx`
- `app/onboarding/actions.ts`
- `lib/onboarding.ts`
- `app/signup/page.tsx`
- `lib/app-routes.ts`
- `components/app-shell.tsx`
- `docs/PATCH_03_ONBOARDING_WIZARD.md`

## Notes

This patch intentionally avoids adding an `onboardingCompletedAt` database field. Completion is inferred from existing health-profile readiness. That keeps the patch easy to review and safe to merge.

A future patch can add a dedicated onboarding status field if the product needs stricter first-run enforcement.
