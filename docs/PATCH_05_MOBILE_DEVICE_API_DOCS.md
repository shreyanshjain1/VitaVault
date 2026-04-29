# Patch 05 — Mobile and Device API Documentation

## Purpose

This patch makes VitaVault's existing mobile and connected-device backend foundation easier to understand, showcase, and continue building on.

Before this patch, the API routes existed in code, but there was no clear product-facing reference for what a mobile client should call or how device readings are expected to be shaped.

## Files added

```txt
app/api-docs/page.tsx
docs/MOBILE_DEVICE_API.md
docs/PATCH_05_MOBILE_DEVICE_API_DOCS.md
```

## What changed

- Added a public `/api-docs` page.
- Documented mobile credential login.
- Documented bearer-token session usage.
- Documented current-user validation.
- Documented logout/token revocation.
- Documented device connection listing.
- Documented device reading ingestion.
- Added request and response examples.
- Added supported reading type matrix.
- Added error response examples.
- Added practical mobile security notes.
- Added a markdown version in `docs/MOBILE_DEVICE_API.md` for repo reviewers.

## Why this matters

VitaVault already has strong backend foundations for mobile/device sync:

- `/api/mobile/auth/login`
- `/api/mobile/auth/me`
- `/api/mobile/auth/logout`
- `/api/mobile/connections`
- `/api/mobile/device-readings`
- `MobileSessionToken`
- `DeviceConnection`
- `DeviceReading`
- `SyncJob`
- reading-to-vital mirroring

This patch turns that backend depth into something visible and explainable for reviewers, mobile developers, and future API work.

## Schema impact

No Prisma migration required.

## Manual test

Open:

```txt
/api-docs
```

Then confirm:

- the page renders without authentication
- endpoint matrix is visible
- code examples are readable
- supported reading types table is visible
- security notes are visible

## Suggested follow-up

A future patch can add:

- downloadable Postman collection
- OpenAPI JSON route
- API playground with sample requests
- admin-visible sync log drilldown
- rate limiting for mobile API endpoints
