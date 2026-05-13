# Patch 71: Vitals Monitor Risk Signal Polish

## Summary

This patch improves the Vitals Monitor with clearer risk, freshness, missing-reading, and provider-review signals.

## Changes

- Added reusable vital freshness helpers.
- Added vital risk states for critical, warning, stale, missing, and stable metrics.
- Added display-ready risk labels, reasons, and next-step guidance per vital metric.
- Added a risk summary payload to the Vitals Monitor data contract.
- Added a Review Queue stat card to `/vitals-monitor`.
- Added a Risk Signal panel to `/vitals-monitor`.
- Updated metric cards with freshness labels, risk labels, reasons, and recommended actions.
- Added focused vitals monitor helper tests.

## Safety

- No Prisma migration.
- No schema changes.
- No package changes.
- No README changes.
- No API behavior changes.
- Uses existing `VitalRecord`, `AlertEvent`, and `DeviceConnection` data only.

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
npm run test:run -- tests/vitals-monitor.test.ts
```
