# Patch 25 — Device Sync Simulator

## Summary

Adds a protected `/device-sync-simulator` workspace that lets reviewers run a safe simulated device sync without requiring Apple Health, Android Health Connect, Fitbit, or device vendor credentials.

The simulator uses existing VitaVault data models instead of mock-only UI cards:

- `DeviceConnection`
- `DeviceReading`
- `SyncJob`
- `JobRun`
- `JobRunLog`
- `VitalRecord`

## What changed

- Added `/device-sync-simulator`
- Added simulator server action for sample sync runs
- Added sample providers:
  - Apple Health
  - Android Health Connect
  - Smart BP Monitor
  - Pulse Oximeter
  - Smart Scale
- Added connection state cards
- Added recent accepted readings
- Added sync job history
- Added mirrored vitals panel
- Added sidebar navigation entry under Monitoring
- Added shared simulator helper/data layer

## Why it matters

VitaVault already had mobile/device ingestion foundations. This patch makes that foundation visible and demo-friendly by allowing a reviewer to trigger a realistic sync flow from the UI.

## Safety notes

- No Prisma migration is required.
- All records are scoped to the signed-in user.
- The simulator creates sample data only inside the user's workspace.
- The simulator is not a medical-device integration and does not claim diagnostic behavior.

## Manual test routes

- `/device-sync-simulator`
- `/device-connection`
- `/vitals-monitor`
- `/trends`
- `/jobs`

## Recommended checks

```bash
npm run lint
npm run typecheck
npm run test:run
```
