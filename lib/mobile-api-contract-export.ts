import { DevicePlatform, DeviceReadingType, ReadingSource } from "@prisma/client";
import { MOBILE_DEVICE_ENDPOINTS, SUPPORTED_DEVICE_READINGS, SUPPORTED_DEVICE_READING_TYPES } from "@/lib/mobile-device-api";
import { MOBILE_API_SECURITY_POLICIES } from "@/lib/mobile-api-security";

export const MOBILE_API_CONTRACT_VERSION = "2026.05.patch50";
export const MOBILE_API_DEFAULT_BASE_URL = "https://your-vitavault-domain.com";
export type MobileApiExportFormat = "openapi" | "postman";

const readingTypeValues = Object.values(DeviceReadingType);
const readingSourceValues = Object.values(ReadingSource);
const devicePlatformValues = Object.values(DevicePlatform);

function contentForSchema(schema: unknown) {
  return { "application/json": { schema } };
}
function contentForExample(example: unknown) {
  return { "application/json": { example } };
}
function endpointPurpose(path: string) {
  return MOBILE_DEVICE_ENDPOINTS.find((endpoint) => endpoint.path === path)?.purpose ?? path;
}

export function getMobileApiContractSummary() {
  return {
    version: MOBILE_API_CONTRACT_VERSION,
    endpointCount: MOBILE_DEVICE_ENDPOINTS.length,
    readingTypeCount: SUPPORTED_DEVICE_READING_TYPES.length,
    exportFormats: ["OpenAPI 3.1", "Postman Collection 2.1"],
    endpoints: MOBILE_DEVICE_ENDPOINTS,
    supportedReadings: SUPPORTED_DEVICE_READINGS,
    securityPolicies: Object.values(MOBILE_API_SECURITY_POLICIES).map((policy) => ({
      endpoint: policy.endpoint,
      label: policy.label,
      limit: policy.limit,
      windowMs: policy.windowMs,
      maxContentLengthBytes: policy.maxContentLengthBytes ?? null,
    })),
  };
}

const errorResponseSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
    details: { type: "object", additionalProperties: true },
    retryAfterSeconds: { type: "number" },
  },
  required: ["error"],
  additionalProperties: true,
} as const;

const userSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    email: { type: "string", format: "email" },
    name: { type: ["string", "null"] },
  },
  required: ["id", "email", "name"],
  additionalProperties: false,
} as const;

const connectionSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    source: { type: "string", enum: readingSourceValues },
    platform: { type: "string", enum: devicePlatformValues },
    clientDeviceId: { type: "string" },
    deviceLabel: { type: ["string", "null"] },
    appVersion: { type: ["string", "null"] },
    status: { type: "string", enum: ["ACTIVE", "ERROR", "REVOKED", "DISCONNECTED"] },
    lastSyncedAt: { type: ["string", "null"], format: "date-time" },
    lastError: { type: ["string", "null"] },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: ["id", "source", "platform", "clientDeviceId", "status", "createdAt", "updatedAt"],
  additionalProperties: true,
} as const;

const readingSchema = {
  type: "object",
  properties: {
    readingType: { type: "string", enum: readingTypeValues },
    capturedAt: { type: "string", format: "date-time" },
    clientReadingId: { type: "string" },
    unit: { type: "string" },
    valueInt: { type: "integer" },
    valueFloat: { type: "number" },
    systolic: { type: "integer" },
    diastolic: { type: "integer" },
    metadata: { type: "object", additionalProperties: true },
    rawPayload: { type: "object", additionalProperties: true },
  },
  required: ["readingType", "capturedAt"],
  additionalProperties: false,
} as const;

const syncRequestSchema = {
  type: "object",
  properties: {
    source: { type: "string", enum: readingSourceValues },
    platform: { type: "string", enum: devicePlatformValues },
    clientDeviceId: { type: "string", maxLength: 191 },
    deviceLabel: { type: "string", maxLength: 191 },
    appVersion: { type: "string", maxLength: 60 },
    scopes: { type: "array", items: { type: "string" }, maxItems: 50 },
    syncMetadata: { type: "object", additionalProperties: true },
    readings: { type: "array", minItems: 1, maxItems: 500, items: { $ref: "#/components/schemas/DeviceReading" } },
  },
  required: ["source", "platform", "clientDeviceId", "readings"],
  additionalProperties: false,
} as const;

export function buildMobileOpenApiSpec(baseUrl = MOBILE_API_DEFAULT_BASE_URL) {
  return {
    openapi: "3.1.0",
    info: {
      title: "VitaVault Mobile and Device API",
      version: MOBILE_API_CONTRACT_VERSION,
      description: "OpenAPI contract for VitaVault mobile auth, device connections, and device reading ingestion.",
    },
    servers: [{ url: baseUrl, description: "VitaVault deployment URL" }],
    tags: [
      { name: "Mobile Authentication", description: "Mobile bearer-token lifecycle." },
      { name: "Device Connections", description: "Connected device records." },
      { name: "Device Readings", description: "Device reading ingestion and vitals mirroring." },
    ],
    paths: {
      "/api/mobile/auth/login": {
        post: {
          tags: ["Mobile Authentication"],
          summary: endpointPurpose("/api/mobile/auth/login"),
          security: [],
          requestBody: { required: true, content: contentForSchema({ $ref: "#/components/schemas/MobileLoginRequest" }) },
          responses: {
            "200": { description: "Mobile token issued.", content: contentForSchema({ $ref: "#/components/schemas/MobileLoginResponse" }) },
            "400": { description: "Invalid payload.", content: contentForSchema({ $ref: "#/components/schemas/ErrorResponse" }) },
            "401": { description: "Invalid credentials.", content: contentForSchema({ $ref: "#/components/schemas/ErrorResponse" }) },
            "413": { description: "Payload too large.", content: contentForSchema({ $ref: "#/components/schemas/ErrorResponse" }) },
            "429": { description: "Rate limited.", content: contentForSchema({ $ref: "#/components/schemas/ErrorResponse" }) },
          },
        },
      },
      "/api/mobile/auth/me": {
        get: {
          tags: ["Mobile Authentication"],
          summary: endpointPurpose("/api/mobile/auth/me"),
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Current mobile session user.", content: contentForSchema({ $ref: "#/components/schemas/MobileMeResponse" }) },
            "401": { description: "Unauthorized mobile session.", content: contentForSchema({ $ref: "#/components/schemas/ErrorResponse" }) },
            "429": { description: "Rate limited.", content: contentForSchema({ $ref: "#/components/schemas/ErrorResponse" }) },
          },
        },
      },
      "/api/mobile/auth/logout": {
        post: {
          tags: ["Mobile Authentication"],
          summary: endpointPurpose("/api/mobile/auth/logout"),
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Mobile token revoked.", content: contentForExample({ success: true }) },
            "401": { description: "Unauthorized mobile session.", content: contentForSchema({ $ref: "#/components/schemas/ErrorResponse" }) },
            "429": { description: "Rate limited.", content: contentForSchema({ $ref: "#/components/schemas/ErrorResponse" }) },
          },
        },
      },
      "/api/mobile/connections": {
        get: {
          tags: ["Device Connections"],
          summary: endpointPurpose("/api/mobile/connections"),
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Device connections.", content: contentForSchema({ $ref: "#/components/schemas/DeviceConnectionsResponse" }) },
            "401": { description: "Unauthorized mobile session.", content: contentForSchema({ $ref: "#/components/schemas/ErrorResponse" }) },
            "429": { description: "Rate limited.", content: contentForSchema({ $ref: "#/components/schemas/ErrorResponse" }) },
          },
        },
      },
      "/api/mobile/device-readings": {
        post: {
          tags: ["Device Readings"],
          summary: endpointPurpose("/api/mobile/device-readings"),
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: contentForSchema({ $ref: "#/components/schemas/DeviceReadingSyncRequest" }) },
          responses: {
            "200": { description: "Readings accepted and mirrored where supported.", content: contentForSchema({ $ref: "#/components/schemas/DeviceReadingSyncResponse" }) },
            "400": { description: "Invalid reading payload.", content: contentForSchema({ $ref: "#/components/schemas/ErrorResponse" }) },
            "401": { description: "Unauthorized mobile session.", content: contentForSchema({ $ref: "#/components/schemas/ErrorResponse" }) },
            "413": { description: "Payload too large.", content: contentForSchema({ $ref: "#/components/schemas/ErrorResponse" }) },
            "429": { description: "Rate limited.", content: contentForSchema({ $ref: "#/components/schemas/ErrorResponse" }) },
          },
        },
      },
    },
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "VitaVault mobile token" } },
      schemas: {
        ErrorResponse: errorResponseSchema,
        MobileUser: userSchema,
        MobileLoginRequest: {
          type: "object",
          properties: { email: { type: "string", format: "email" }, password: { type: "string" }, deviceName: { type: "string", maxLength: 120 } },
          required: ["email", "password"],
          additionalProperties: false,
        },
        MobileLoginResponse: {
          type: "object",
          properties: { token: { type: "string" }, expiresAt: { type: "string", format: "date-time" }, user: { $ref: "#/components/schemas/MobileUser" } },
          required: ["token", "expiresAt", "user"],
          additionalProperties: false,
        },
        MobileMeResponse: { type: "object", properties: { user: { $ref: "#/components/schemas/MobileUser" } }, required: ["user"], additionalProperties: false },
        DeviceConnection: connectionSchema,
        DeviceConnectionsResponse: { type: "object", properties: { connections: { type: "array", items: { $ref: "#/components/schemas/DeviceConnection" } } }, required: ["connections"], additionalProperties: false },
        DeviceReading: readingSchema,
        DeviceReadingSyncRequest: syncRequestSchema,
        DeviceReadingSyncResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            connection: { $ref: "#/components/schemas/DeviceConnection" },
            sync: {
              type: "object",
              properties: {
                syncJobId: { type: "string" },
                requestedCount: { type: "integer" },
                acceptedCount: { type: "integer" },
                mirroredCount: { type: "integer" },
                duplicateCount: { type: "integer" },
              },
              required: ["syncJobId", "requestedCount", "acceptedCount", "mirroredCount", "duplicateCount"],
              additionalProperties: false,
            },
          },
          required: ["success", "connection", "sync"],
          additionalProperties: false,
        },
      },
    },
    "x-vitavault": getMobileApiContractSummary(),
  };
}

function postmanUrl(path: string) {
  return { raw: `{{baseUrl}}${path}`, host: ["{{baseUrl}}"], path: path.split("/").filter(Boolean) };
}
function postmanAuthHeader() {
  return { key: "Authorization", value: "Bearer {{mobileToken}}", type: "text" };
}
function postmanJsonBody(raw: unknown) {
  return { mode: "raw", raw: JSON.stringify(raw, null, 2), options: { raw: { language: "json" } } };
}

export function buildMobilePostmanCollection(baseUrl = MOBILE_API_DEFAULT_BASE_URL) {
  return {
    info: {
      name: "VitaVault Mobile and Device API",
      description: "Postman collection for VitaVault mobile auth, session checks, device connections, and reading sync.",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      version: MOBILE_API_CONTRACT_VERSION,
    },
    variable: [
      { key: "baseUrl", value: baseUrl, type: "string" },
      { key: "mobileToken", value: "paste-token-from-login-response", type: "string" },
    ],
    item: [
      {
        name: "Mobile Authentication",
        item: [
          { name: "Login and issue mobile token", request: { method: "POST", header: [{ key: "Content-Type", value: "application/json", type: "text" }], url: postmanUrl("/api/mobile/auth/login"), body: postmanJsonBody({ email: "patient@example.com", password: "correct-horse-battery-staple", deviceName: "Rey's Android Phone" }) } },
          { name: "Get current mobile user", request: { method: "GET", header: [postmanAuthHeader()], url: postmanUrl("/api/mobile/auth/me") } },
          { name: "Logout and revoke token", request: { method: "POST", header: [postmanAuthHeader()], url: postmanUrl("/api/mobile/auth/logout") } },
        ],
      },
      { name: "Device Connections", item: [{ name: "List device connections", request: { method: "GET", header: [postmanAuthHeader()], url: postmanUrl("/api/mobile/connections") } }] },
      {
        name: "Device Readings",
        item: [
          {
            name: "Sync device readings",
            request: {
              method: "POST",
              header: [postmanAuthHeader(), { key: "Content-Type", value: "application/json", type: "text" }],
              url: postmanUrl("/api/mobile/device-readings"),
              body: postmanJsonBody({
                source: ReadingSource.ANDROID_HEALTH_CONNECT,
                platform: DevicePlatform.ANDROID,
                clientDeviceId: "android-pixel-8-pro",
                deviceLabel: "Pixel 8 Pro",
                appVersion: "1.0.0",
                scopes: ["vitals:write", "device:sync"],
                syncMetadata: { batteryLevel: 88, network: "wifi" },
                readings: [
                  { readingType: DeviceReadingType.HEART_RATE, capturedAt: "2026-04-29T08:35:00.000Z", clientReadingId: "hr-001", unit: "bpm", valueInt: 78 },
                  { readingType: DeviceReadingType.BLOOD_PRESSURE, capturedAt: "2026-04-29T08:36:00.000Z", clientReadingId: "bp-001", unit: "mmHg", systolic: 118, diastolic: 76 },
                ],
              }),
            },
          },
        ],
      },
    ],
  };
}

export function getMobileApiExportFileName(format: MobileApiExportFormat) {
  return format === "openapi" ? "vitavault-mobile-openapi.json" : "vitavault-mobile-postman-collection.json";
}

export function getMobileApiExportDescription(format: MobileApiExportFormat) {
  return format === "openapi"
    ? "OpenAPI 3.1 contract for mobile/device API clients."
    : "Postman Collection 2.1 workspace for mobile/device API testing.";
}
