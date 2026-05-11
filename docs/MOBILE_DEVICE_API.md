# VitaVault Mobile and Device API

VitaVault exposes a mobile/device ingestion layer for native apps, wearable companion apps, QA tools, and future health-data integrations. The API lets a client authenticate with a dedicated mobile token, list connected devices, submit normalized health readings, and keep raw device data traceable while mirroring supported values into the patient health timeline.

This document describes the current supported contract only. Values listed here are backed by the application schema and should be treated as the source of truth for mobile client work.

## Product-facing API docs

The same contract is available inside the app at:

```txt
/api-docs
```

Machine-readable exports are available at:

```txt
/api/mobile/openapi
/api/mobile/postman
```

## Base URL

Use your local or deployed VitaVault app URL.

```txt
https://your-vitavault-domain.com
```

Local development usually uses:

```txt
http://localhost:3000
```

## Authentication model

Mobile clients authenticate with normal account credentials and receive a dedicated bearer token for mobile API calls.

The raw token is returned only once to the client. VitaVault stores a SHA-256 hash of the token in `MobileSessionToken`, which allows the token to be revoked without storing the plaintext secret.

Protected mobile endpoints require:

```txt
Authorization: Bearer <mobile_token>
```

Mobile tokens are separate from browser sessions. Logging out of the browser does not automatically revoke a mobile token, and revoking a mobile token does not delete historical device readings.

## Endpoint summary

| Method | Route | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/mobile/auth/login` | Email/password | Validate credentials and issue a mobile bearer token |
| `GET` | `/api/mobile/auth/me` | Bearer token | Validate the current mobile token and return the user |
| `POST` | `/api/mobile/auth/logout` | Bearer token | Revoke the current mobile token |
| `GET` | `/api/mobile/connections` | Bearer token | List the user's mobile/device connections |
| `POST` | `/api/mobile/device-readings` | Bearer token | Upsert a connection, persist readings, create a sync job, and mirror supported vitals |

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

### Successful response

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

### Successful response

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

## Supported contract values

### Reading sources

| Value | Typical use |
|---|---|
| `MANUAL` | Manual or admin-entered reading source |
| `ANDROID_HEALTH_CONNECT` | Android Health Connect sync |
| `APPLE_HEALTH` | Apple HealthKit-normalized sync |
| `FITBIT` | Fitbit provider integration |
| `SMART_BP_MONITOR` | Blood pressure monitor gateway |
| `SMART_SCALE` | Smart scale gateway |
| `PULSE_OXIMETER` | Pulse oximeter gateway |
| `OTHER` | Custom source, QA client, or vendor gateway |

### Device platforms

| Value | Typical use |
|---|---|
| `ANDROID` | Android phones and Health Connect clients |
| `IOS` | iPhone and HealthKit clients |
| `WEB` | Web dashboards, QA tools, or browser-based sync clients |
| `OTHER` | Custom gateway or provider that does not fit the main platform buckets |

### Connection statuses

| Value | Meaning |
|---|---|
| `ACTIVE` | Connection is active and can continue syncing |
| `DISCONNECTED` | Connection is no longer actively syncing |
| `REVOKED` | User or system revoked the connection/token |
| `ERROR` | Connection encountered a sync or validation problem |

### Reading types

| Reading type | Required value | VitaVault behavior |
|---|---|---|
| `HEART_RATE` | `valueInt` | Mirrors into `heartRate` |
| `BLOOD_PRESSURE` | `systolic` and `diastolic` | Mirrors into `systolic` and `diastolic` |
| `OXYGEN_SATURATION` | `valueInt` | Mirrors into `oxygenSaturation` |
| `WEIGHT` | `valueFloat` | Mirrors into `weightKg` |
| `BLOOD_GLUCOSE` | `valueFloat` | Mirrors into `bloodSugar` |
| `TEMPERATURE` | `valueFloat` | Mirrors into `temperatureC` |
| `STEPS` | `valueInt` | Stored as a device reading only |

`SLEEP_MINUTES` is not a supported request value in the current contract. Add a dedicated schema migration and ingestion path before exposing sleep tracking to mobile clients.

## Validation and error responses

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

## Device integration surfaces

Authenticated users can review, test, and manage device integrations from these app routes:

| Route | Purpose |
|---|---|
| `/device-connection` | Device connection dashboard with lifecycle actions, QA payloads, supported contract details, recent readings, and sync jobs |
| `/device-connection/[id]` | Per-device detail page with readings, sync jobs, job runs, metadata, mirrored vitals, and lifecycle actions |
| `/device-sync-simulator` | Safe demo sync runner that creates connections, readings, sync jobs, job runs, and mirrored vitals |

Lifecycle actions are user-owned and audited. Revoking a connection keeps historical readings available for traceability.

## Machine-readable exports

VitaVault generates API contract exports for QA, mobile client development, reviewer demos, and future client generation.

| Export | Route | Use |
|---|---|---|
| OpenAPI 3.1 JSON | `/api/mobile/openapi` | Import into Swagger UI, Insomnia, API gateways, or client generators |
| Postman Collection 2.1 JSON | `/api/mobile/postman` | Import into Postman and set the `baseUrl` and `mobileToken` variables |

Optional base URL override:

```txt
/api/mobile/openapi?baseUrl=https://vita-vault-demo.example.com
/api/mobile/postman?baseUrl=https://vita-vault-demo.example.com
```

## Security notes

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

## Ingestion behavior

The device readings endpoint currently:

1. Validates the mobile bearer token.
2. Validates the sync payload.
3. Upserts the `DeviceConnection` record.
4. Creates a `SyncJob` record.
5. Deduplicates device readings by `clientReadingId` or a captured-value signature.
6. Persists raw `DeviceReading` records.
7. Mirrors supported reading types into normal `Vital` records.
8. Returns sync counters to the client.

This keeps raw device data available while making important readings visible in the normal VitaVault patient timeline.

## Provider connector abstraction

Provider-specific logic stays separate from the core mobile ingestion contract. Each connector describes how an external source should authenticate, what readings it can send, which scopes it needs, and how payloads normalize into `/api/mobile/device-readings`.

| Provider | Source value | Status | Typical platform | Notes |
|---|---|---|---|---|
| Android Health Connect | `ANDROID_HEALTH_CONNECT` | API-ready | Android | Best current native-client target for steps, vitals, weight, glucose, and temperature |
| Apple HealthKit | `APPLE_HEALTH` | Adapter contract | iOS | Uses the same VitaVault payload shape after HealthKit authorization and normalization |
| Fitbit | `FITBIT` | Planned provider | Web / other gateway | Requires future OAuth token storage before real provider sync |
| Smart BP Monitor | `SMART_BP_MONITOR` | API-ready | Companion app / gateway | Normalizes blood pressure and pulse into vitals |
| Smart Scale | `SMART_SCALE` | API-ready | Companion app / gateway | Normalizes weight into vitals |
| Pulse Oximeter | `PULSE_OXIMETER` | API-ready | Companion app / gateway | Normalizes SpO2 and pulse into vitals |
| Custom source | `OTHER` | Adapter contract | Web / other | Useful for QA tools, vendor CSV imports, and future custom gateways |

The source of truth for provider connector mapping is:

```txt
lib/device-provider-connectors.ts
```

Provider connectors do not add database tables. They are adapter contracts that sit on top of the existing `ReadingSource`, `DeviceConnection`, `DeviceReading`, and `SyncJob` models.

## SDK and QA examples

The repository includes copy-paste examples under:

```txt
examples/mobile-api
```

| File | Purpose |
|---|---|
| `examples/mobile-api/vitavault-mobile-client.ts` | Framework-neutral TypeScript client for login, session checks, logout, device connections, and reading sync |
| `examples/mobile-api/react-native-sync.ts` | React Native-style helper layer for secure token storage and queued health reading sync |
| `examples/mobile-api/curl-examples.md` | Terminal-ready cURL examples for smoke testing the mobile API |

These examples use schema-backed contract values and avoid extra runtime dependencies.

## Reviewer smoke test flow

1. Start the app locally or open the deployed demo.
2. Sign in with a test account.
3. Call `/api/mobile/auth/login` to issue a mobile token.
4. Use the token against `/api/mobile/device-readings` with the sample payload above.
5. Open `/device-connection` to confirm the connection, sync job, and recent readings.
6. Open the patient vitals/timeline surfaces to confirm mirrored supported readings.
