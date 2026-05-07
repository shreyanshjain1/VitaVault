# Patch 48 Hotfix: Demo Metric Types

## Summary

This hotfix fixes the TypeScript error in the Data Quality Center demo page by ensuring all `MetricGrid` values are strings.

## Changed files

- `app/demo/data-quality/page.tsx`

## Safety

- No Prisma schema changes
- No migration changes
- No package changes
- No app logic changes
- Demo display-only type fix

## Verification

Run:

```bash
npm run typecheck
npm run lint
npm run test:run
```
