# VitaVault API Overview

This document summarizes VitaVault's API and route-handler surface at a reviewer level. For detailed mobile/device payloads, supported enum values, and generated exports, see [`MOBILE_DEVICE_API.md`](./MOBILE_DEVICE_API.md).

## API route groups

| Group | Routes | Purpose |
|---|---|---|
| Auth | `/api/auth/[...nextauth]` | Auth.js/NextAuth route handler. |
| Health/readiness | `/api/health` | Deployment and demo readiness metadata. |
| Documents | `/api/documents/[id]/download` | Protected document download behavior. |
| Exports | `/exports/[type]` | Export packet download route for supported export types. |
| Jobs | `/api/jobs/dispatch` | Admin-protected background job dispatch. |
| Internal alert scans | `/api/internal/alerts/scan`, `/api/internal/alerts/evaluate` | Internal alert evaluation endpoints protected by internal API checks. |
| Mobile auth | `/api/mobile/auth/login`, `/api/mobile/auth/me`, `/api/mobile/auth/logout` | Mobile session login, current user, and logout flow. |
| Mobile devices | `/api/mobile/connections`, `/api/mobile/device-readings` | Device connection and reading ingestion APIs. |
| Contract exports | `/api/mobile/openapi`, `/api/mobile/postman` | Machine-readable mobile API contract exports. |

## Auth API

### `/api/auth/[...nextauth]`

Auth.js/NextAuth integration point for the web app. Authenticated server actions and protected pages rely on session helpers rather than calling this route directly.

## Health and readiness API

### `/api/health`

Returns application health/readiness information suitable for deployment review.

Current responsibilities include:

- environment readiness mode
- sanitized environment status
- demo readiness guidance
- deployment guidance
- health-check metadata that avoids exposing secrets

This route is designed to help identify missing configuration without leaking private values.

## Document API

### `/api/documents/[id]/download`

Protected route for downloading a stored medical document. It should preserve authorization checks and avoid exposing private files without a valid session/access context.

Related modules:

- `lib/document-storage.ts`
- `lib/storage/*`
- `lib/document-hub.ts`

## Export API

### `/exports/[type]`

Route handler for supported export types. Unknown export types should return structured JSON with supported types and safe response headers.

Related modules:

- `lib/export-center.ts`
- `lib/export-definitions.ts`
- `lib/export.ts`

## Job and internal APIs

### `/api/jobs/dispatch`

Admin-protected endpoint for dispatching supported job operations.

### `/api/internal/alerts/scan`

Internal endpoint for scanning alert rules.

### `/api/internal/alerts/evaluate`

Internal endpoint for evaluating alert behavior.

Internal APIs should not be treated as public client APIs. They should be protected by route policy and/or internal API authorization helpers.

## Mobile API

The mobile API provides a foundation for future native or React Native clients.

| Route | Method intent | Purpose |
|---|---|---|
| `/api/mobile/auth/login` | Login | Create a mobile session token. |
| `/api/mobile/auth/me` | Session check | Return the current mobile user/session context. |
| `/api/mobile/auth/logout` | Logout | Revoke or end the mobile session. |
| `/api/mobile/connections` | Connection management | Register or list device connections. |
| `/api/mobile/device-readings` | Ingestion | Submit mobile/device readings. |
| `/api/mobile/openapi` | Contract export | Return an OpenAPI-style contract. |
| `/api/mobile/postman` | Contract export | Return a Postman collection. |

Related modules:

- `lib/mobile-auth.ts`
- `lib/mobile-device-api.ts`
- `lib/mobile-readings.ts`
- `lib/mobile-api-security.ts`
- `lib/mobile-api-contract-export.ts`
- `lib/mobile-api-sdk-examples.ts`

## Mobile contract values

The current mobile/device contract is schema-backed and tested. Important value groups include:

- `DevicePlatform`
- `DeviceConnectionStatus`
- `DeviceReadingType`
- `ReadingSource`

Do not add new values to SDK examples or docs unless the Prisma schema, API validators, OpenAPI/Postman exports, and tests are updated together.

## API safety expectations

When adding or changing API behavior:

1. Keep response bodies web-compatible for Next.js route handlers.
2. Avoid exposing raw secrets or private storage paths.
3. Return structured errors for unknown or unsupported export/API types.
4. Keep mobile API rate limits, payload size checks, and no-store headers intact.
5. Add/update tests when contract values or route policies change.
6. Avoid Prisma migrations unless the feature cannot be implemented with existing models.

## API-related tests

Relevant tests include:

- `tests/mobile-device-api.test.ts`
- `tests/mobile-api-security.test.ts`
- `tests/mobile-api-contract-export.test.ts`
- `tests/mobile-api-sdk-examples.test.ts`
- `tests/internal-api-auth.test.ts`
- `tests/document-download-route.test.ts`
- `tests/exports-route.test.ts`
- `tests/route-policy.test.ts`
