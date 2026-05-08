# VitaVault Mobile and Device API

This document summarizes the current VitaVault mobile/device API foundation for Android, mobile sync, QA, OpenAPI import, and Postman testing. It intentionally lists only reading types currently backed by the Prisma `DeviceReadingType` enum.

The same information is also available as a product-facing page at:

```txt
/api-docs
```

## Base URL

```txt
https://your-vitavault-domain.com
```

Use your local or deployed app URL when testing.

## Authentication model

VitaVault mobile clients authenticate with normal account credentials, but they receive a separate mobile bearer token.

The raw token is returned once to the client. The server stores only a SHA-256 hash of the token in `MobileSessionToken`.

Protected mobile endpoints require:

```txt
Authorization: Bearer <mobile_token>
```

## Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/mobile/auth/login` | Public credentials | Validate email/password and issue a mobile bearer token |
| GET | `/api/mobile/auth/me` | Bearer token | Validate current mobile session and return user |
| POST | `/api/mobile/auth/logout` | Bearer token | Revoke current mobile token |
| GET | `/api/mobile/connections` | Bearer token | List connected mobile/device sync records |
| POST | `/api/mobile/device-readings` | Bearer token | Upsert connection, persist readings, create sync job, and mirror supported vitals |

## Login

### Request

```http
POST /api/mobile/auth/login
Content-Type: application/json
```

```json
{
  "email": "patient@example.com",
  "password": "correct-horse-battery-staple",
  "deviceName": "Rey's Android Phone"
}
```

### Response

```json
{
  "token": "vvm_9f9f...mobile_token...",
  "expiresAt": "2026-07-28T08:30:00.000Z",
  "user": {
    "id": "user_123",
    "email": "patient@example.com",
    "name": "Rey Patient"
  }
}
```

## Current mobile user

```http
GET /api/mobile/auth/me
Authorization: Bearer vvm_9f9f...mobile_token...
```

```json
{
  "user": {
    "id": "user_123",
    "email": "patient@example.com",
    "name": "Rey Patient"
  }
}
```

## Logout

```http
POST /api/mobile/auth/logout
Authorization: Bearer vvm_9f9f...mobile_token...
```

```json
{
  "success": true
}
```

## List device connections

```http
GET /api/mobile/connections
Authorization: Bearer vvm_9f9f...mobile_token...
```

```json
{
  "connections": [
    {
      "id": "connection_123",
      "source": "ANDROID_HEALTH_CONNECT",
      "platform": "ANDROID",
      "clientDeviceId": "android-pixel-8-pro",
      "deviceLabel": "Pixel 8 Pro",
      "appVersion": "1.0.0",
      "status": "ACTIVE",
      "lastSyncedAt": "2026-04-29T08:40:00.000Z",
      "lastError": null,
      "createdAt": "2026-04-29T08:00:00.000Z",
      "updatedAt": "2026-04-29T08:40:00.000Z"
    }
  ]
}
```

## Submit device readings

```http
POST /api/mobile/device-readings
Authorization: Bearer vvm_9f9f...mobile_token...
Content-Type: application/json
```

```json
{
  "source": "ANDROID_HEALTH_CONNECT",
  "platform": "ANDROID",
  "clientDeviceId": "android-pixel-8-pro",
  "deviceLabel": "Pixel 8 Pro",
  "appVersion": "1.0.0",
  "scopes": ["vitals:write", "device:sync"],
  "syncMetadata": {
    "batteryLevel": 88,
    "network": "wifi"
  },
  "readings": [
    {
      "readingType": "HEART_RATE",
      "capturedAt": "2026-04-29T08:35:00.000Z",
      "clientReadingId": "hr-001",
      "unit": "bpm",
      "valueInt": 78
    },
    {
      "readingType": "BLOOD_PRESSURE",
      "capturedAt": "2026-04-29T08:36:00.000Z",
      "clientReadingId": "bp-001",
      "unit": "mmHg",
      "systolic": 118,
      "diastolic": 76
    },
    {
      "readingType": "WEIGHT",
      "capturedAt": "2026-04-29T08:37:00.000Z",
      "clientReadingId": "weight-001",
      "unit": "kg",
      "valueFloat": 71.4
    }
  ]
}
```

### Response

```json
{
  "success": true,
  "connection": {
    "id": "connection_123",
    "source": "ANDROID_HEALTH_CONNECT",
    "platform": "ANDROID",
    "clientDeviceId": "android-pixel-8-pro",
    "deviceLabel": "Pixel 8 Pro",
    "status": "ACTIVE"
  },
  "sync": {
    "syncJobId": "sync_123",
    "requestedCount": 3,
    "acceptedCount": 3,
    "mirroredCount": 3,
    "duplicateCount": 0
  }
}
```

## Supported reading types

| Reading type | Required value | VitaVault behavior |
|---|---|---|
| `HEART_RATE` | `valueInt` | Mirrors into `heartRate` |
| `BLOOD_PRESSURE` | `systolic` and `diastolic` | Mirrors into `systolic` and `diastolic` |
| `OXYGEN_SATURATION` | `valueInt` | Mirrors into `oxygenSaturation` |
| `WEIGHT` | `valueFloat` | Mirrors into `weightKg` |
| `BLOOD_GLUCOSE` | `valueFloat` | Mirrors into `bloodSugar` |
| `TEMPERATURE` | `valueFloat` | Mirrors into `temperatureC` |
| `STEPS` | `valueInt` | Stored as device reading only |

### Unsupported or future reading types

`SLEEP_MINUTES` is intentionally not listed as a supported request value yet because it is not present in the current Prisma `DeviceReadingType` enum. Add a dedicated schema migration before exposing sleep tracking to mobile clients.

## Error responses

### Invalid payload

```json
{
  "error": "Invalid device reading payload.",
  "details": {
    "fieldErrors": {
      "readings": ["Array must contain at least 1 element(s)"]
    }
  }
}
```

### Unauthorized

```json
{
  "error": "Unauthorized mobile session."
}
```

### Server error

```json
{
  "error": "Unable to ingest device readings."
}
```


## Device Integration v2 UI

Patch 46 adds authenticated device integration surfaces on top of the mobile API foundation:

| Route | Purpose |
|---|---|
| `/device-connection` | Connection dashboard, lifecycle actions, QA payload, supported reading contract, recent readings, and sync jobs |
| `/device-connection/[id]` | Per-device detail page with readings, sync jobs, job runs, metadata, mirrored vitals, and lifecycle actions |
| `/device-sync-simulator` | Safe demo sync runner that creates connections, readings, sync jobs, job runs, and mirrored vitals |

Lifecycle actions are user-owned and audited. Revoking a connection does not delete historical readings; it marks the connection as no longer active while keeping traceability intact.


## Machine-readable exports

Patch 50 adds generated API contract downloads for reviewers, QA, and future mobile client work.

| Export | Route | Use |
|---|---|---|
| OpenAPI 3.1 JSON | `/api/mobile/openapi` | Import into Swagger UI, Insomnia, API gateways, or client generators. |
| Postman Collection 2.1 JSON | `/api/mobile/postman` | Import into Postman and set `baseUrl` plus `mobileToken` variables. |

Both exports are generated from VitaVault's existing mobile API contract helpers and include the five supported mobile endpoints, bearer-token security, schema-backed reading types, request examples, response schemas, and rate-limit/security context.

Optional base URL override:

```txt
/api/mobile/openapi?baseUrl=https://vita-vault-demo.example.com
/api/mobile/postman?baseUrl=https://vita-vault-demo.example.com
```

## Security notes

Patch 49 hardens the mobile API surface without changing the Prisma schema or mobile contract.

- Use HTTPS only in production.
- Store the mobile token in secure device storage, not plaintext storage.
- Treat mobile API tokens separately from browser sessions.
- Revoke mobile tokens from the Security page when a device is lost.
- Keep reading payloads minimal and avoid sending unnecessary PHI.
- Credential login is rate limited by email and client IP.
- Bearer-token endpoints are rate limited by endpoint and client IP.
- Device reading sync rejects oversized payloads before JSON parsing when `Content-Length` is available.
- Mobile API responses use `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
- Mobile session creation and revocation are written to the access audit timeline.

## Implementation notes

The device readings endpoint currently:

1. Validates the mobile bearer token.
2. Validates the sync payload with Zod.
3. Upserts the `DeviceConnection` record.
4. Creates a `SyncJob` record.
5. Deduplicates device readings using either `clientReadingId` or a captured-value signature.
6. Persists raw `DeviceReading` records.
7. Mirrors supported reading types into normal `Vital` records.
8. Returns sync counters to the client.

This keeps the raw device data available while still making important readings visible in the normal VitaVault patient timeline.

## Provider connector abstraction

VitaVault keeps provider-specific logic separate from the core mobile ingestion contract. Each connector describes how an external source should authenticate, what readings it can send, which scopes it needs, and how payloads should normalize into `/api/mobile/device-readings`.

| Provider | Source value | Status | Typical platform | Notes |
|---|---|---|---|---|
| Android Health Connect | `ANDROID_HEALTH_CONNECT` | API-ready | Android | Best current native-client target for steps, vitals, weight, glucose, and temperature. |
| Apple HealthKit | `APPLE_HEALTH` | Adapter contract | iOS | Uses the same VitaVault payload shape after HealthKit authorization and normalization. |
| Fitbit | `FITBIT` | Planned provider | Web / wearable | Requires future OAuth token storage before real provider sync. |
| Smart BP Monitor | `SMART_BP_MONITOR` | API-ready | Companion app / gateway | Normalizes blood pressure and pulse into vitals. |
| Smart Scale | `SMART_SCALE` | API-ready | Companion app / gateway | Normalizes weight into vitals. |
| Pulse Oximeter | `PULSE_OXIMETER` | API-ready | Companion app / gateway | Normalizes SpO2 and pulse into vitals. |
| Custom source | `OTHER` | Adapter contract | Web / other | Useful for QA tools, vendor CSV imports, and future custom gateways. |

The source of truth for this mapping is:

```txt
lib/device-provider-connectors.ts
```

Provider connectors do not add new database tables. They are adapter contracts that sit on top of the existing `ReadingSource`, `DeviceConnection`, `DeviceReading`, and `SyncJob` models.

## SDK and QA examples

The repository includes copy-paste examples under:

```txt
examples/mobile-api
```

| File | Purpose |
|---|---|
| `examples/mobile-api/vitavault-mobile-client.ts` | Framework-neutral TypeScript client for login, session checks, logout, device connections, and reading sync. |
| `examples/mobile-api/react-native-sync.ts` | React Native-style helper layer for secure token storage and queued health reading sync. |
| `examples/mobile-api/curl-examples.md` | Terminal-ready cURL examples for smoke testing the mobile API. |

These examples use the same schema-backed reading types documented above and intentionally avoid extra runtime dependencies.
