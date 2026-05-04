# Patch 18 — Vitals Monitor

## Summary

Adds a protected Vitals Monitor workspace for focused review of blood pressure, heart rate, oxygen saturation, glucose, temperature, weight, device coverage, open vital alerts, and recent vital timelines.

## Files changed

- `app/vitals-monitor/page.tsx`
- `lib/vitals-monitor.ts`
- `lib/app-routes.ts`
- `docs/PATCH_18_VITALS_MONITOR.md`

## Product value

This patch turns the existing vitals data into a practical monitoring workspace instead of leaving vitals as only a record list.

## What was added

- New `/vitals-monitor` route
- Vitals readiness score
- Metric cards for blood pressure, heart rate, oxygen, blood sugar, temperature, and weight
- Latest value, previous value, delta, status, and capture time per metric
- Urgent and watch-zone detection
- 30-day average panel
- Recent vitals timeline
- Device connection signal panel
- Recommended vital action queue
- Sidebar navigation entry

## Safety notes

- No Prisma migration required
- Reuses existing `VitalRecord`, `AlertEvent`, and `DeviceConnection` models
- Does not change existing `/vitals` create/edit behavior
