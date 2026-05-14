# Patch 80 — Public Demo QA Sweep

## Summary

Patch 80 improves the public `/demo` experience so the no-login reviewer walkthrough feels easier to navigate and safer to share.

## Changes

- Grouped the demo sidebar into reviewer-focused sections.
- Added shared reviewer CTAs for the demo shell.
- Added a demo QA checklist to the overview page.
- Added a grouped reviewer map to the overview page.
- Expanded demo route coverage tests so every public demo page must be discoverable in navigation.
- Added tests for duplicate demo hrefs/labels, nav group coverage, CTA route validity, and QA checklist readiness.

## Safety

- No Prisma migration.
- No schema changes.
- No package changes.
- No README changes.
- No authenticated app behavior changes.
- No API route behavior changes.
- Public demo pages remain read-only.

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
npm run test:run -- tests/demo-route-coverage.test.ts
```
