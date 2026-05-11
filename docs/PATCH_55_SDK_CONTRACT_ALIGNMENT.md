# Patch 55 — Mobile SDK Contract Alignment

## Summary

Patch 55 keeps the published mobile API SDK examples aligned with the current VitaVault Prisma-backed API contract.

## Changes

- Removed unsupported `WEARABLE` and `BLUETOOTH` values from the public `VitaVaultDevicePlatform` SDK type.
- Added `VITAVAULT_DEVICE_PLATFORMS` as a runtime-safe exported platform list for SDK consumers and tests.
- Added a regression test to prevent SDK platform values from drifting away from the server contract.

## Why this matters

The current Prisma `DevicePlatform` enum supports only:

- `ANDROID`
- `IOS`
- `WEB`
- `OTHER`

The SDK example now matches that contract exactly, so mobile developers will not submit platform values rejected by the `/api/mobile/device-readings` endpoint.

## Safety

- No Prisma migration added.
- No package dependency changes.
- No README changes.
- No route or API behavior changes.
- Existing sample payload behavior is preserved.
