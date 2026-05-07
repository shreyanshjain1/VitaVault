# Patch 46: Device Integration v2

Patch 46 turns the device/mobile foundation into a visible product module instead of a roadmap-only page.

## What changed

- Rebuilt `/device-connection` into a real integration dashboard backed by `DeviceConnection`, `DeviceReading`, `SyncJob`, `JobRun`, `VitalRecord`, and `MobileSessionToken` data.
- Added `/device-connection/[id]` for per-device detail review.
- Added safe lifecycle server actions: disconnect, reconnect, revoke with `REVOKE` confirmation, and clear last error.
- Added audit-log writes for device lifecycle actions.
- Added a Mobile API QA panel with a schema-backed sample payload and checklist.
- Added supported reading type display sourced from the mobile API contract.
- Linked simulator connection cards to the new device detail page.
- Added pure helper coverage for labels, health state, JSON parsing, scopes, reading display, and QA payload generation.

## Safety

- No Prisma schema changes.
- No migration changes.
- No package changes.
- No changes to mobile endpoint authentication behavior.
- Lifecycle actions are scoped to the signed-in user.

## Current limitations

- Provider connectors are still simulated/foundational.
- Apple Health, Health Connect, Fitbit, and Bluetooth device integrations still need real vendor/mobile work.
- Sleep readings remain intentionally unsupported until a dedicated enum migration is added.
