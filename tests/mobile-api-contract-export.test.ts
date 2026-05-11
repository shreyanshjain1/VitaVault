import { describe, expect, it } from "vitest";
import { DevicePlatform, DeviceReadingType, ReadingSource } from "@prisma/client";
import {
  buildMobileOpenApiSpec,
  buildMobilePostmanCollection,
  getMobileApiContractSummary,
  getMobileApiExportFileName,
} from "@/lib/mobile-api-contract-export";
import { MOBILE_DEVICE_ENDPOINTS, SUPPORTED_DEVICE_READING_TYPES } from "@/lib/mobile-device-api";
import { VITAVAULT_DEVICE_PLATFORMS, VITAVAULT_READING_SOURCES, VITAVAULT_READING_TYPES } from "@/examples/mobile-api/vitavault-mobile-client";

const mobileEndpoints = [
  "/api/mobile/auth/login",
  "/api/mobile/auth/me",
  "/api/mobile/auth/logout",
  "/api/mobile/connections",
  "/api/mobile/device-readings",
];

function getSyncPostmanBody(collection: ReturnType<typeof buildMobilePostmanCollection>) {
  const deviceReadingsGroup = collection.item.find((group) => group.name === "Device Readings");
  const syncRequest = deviceReadingsGroup?.item.find((item) => item.name === "Sync device readings");
  const rawBody = syncRequest?.request.body?.raw;
  if (!rawBody) throw new Error("Missing Postman sync request body.");
  return JSON.parse(rawBody) as { source: string; platform: string; readings: Array<{ readingType: string }> };
}

describe("mobile API contract export", () => {
  it("builds an OpenAPI contract for every supported mobile endpoint", () => {
    const spec = buildMobileOpenApiSpec("https://demo.vitavault.test");

    expect(spec.openapi).toBe("3.1.0");
    expect(spec.servers[0]?.url).toBe("https://demo.vitavault.test");

    for (const endpoint of mobileEndpoints) {
      expect(Object.keys(spec.paths)).toContain(endpoint);
    }

    expect(spec.components.securitySchemes.bearerAuth.scheme).toBe("bearer");
    expect(spec.components.schemas.DeviceReadingSyncRequest.required).toContain("readings");
    expect(spec.components.schemas.DeviceReadingSyncRequest.properties.readings.maxItems).toBe(500);
  });

  it("keeps OpenAPI schema enums aligned with Prisma and SDK constants", () => {
    const spec = buildMobileOpenApiSpec("https://demo.vitavault.test");
    const connectionSchema = spec.components.schemas.DeviceConnection;
    const readingSchema = spec.components.schemas.DeviceReading;
    const syncRequestSchema = spec.components.schemas.DeviceReadingSyncRequest;

    expect([...connectionSchema.properties.platform.enum].sort()).toEqual(Object.values(DevicePlatform).sort());
    expect([...connectionSchema.properties.platform.enum].sort()).toEqual([...VITAVAULT_DEVICE_PLATFORMS].sort());
    expect([...connectionSchema.properties.source.enum].sort()).toEqual(Object.values(ReadingSource).sort());
    expect([...connectionSchema.properties.source.enum].sort()).toEqual([...VITAVAULT_READING_SOURCES].sort());
    expect([...readingSchema.properties.readingType.enum].sort()).toEqual(Object.values(DeviceReadingType).sort());
    expect([...readingSchema.properties.readingType.enum].sort()).toEqual([...VITAVAULT_READING_TYPES].sort());
    expect([...syncRequestSchema.properties.platform.enum].sort()).toEqual(Object.values(DevicePlatform).sort());
    expect([...syncRequestSchema.properties.source.enum].sort()).toEqual(Object.values(ReadingSource).sort());
  });

  it("builds a Postman collection with grouped mobile requests", () => {
    const collection = buildMobilePostmanCollection("https://demo.vitavault.test");

    expect(collection.info.schema).toContain("collection/v2.1.0");
    expect(collection.variable).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "baseUrl", value: "https://demo.vitavault.test" }),
        expect.objectContaining({ key: "mobileToken" }),
      ])
    );
    expect(collection.item.map((group) => group.name)).toEqual([
      "Mobile Authentication",
      "Device Connections",
      "Device Readings",
    ]);
  });

  it("keeps Postman sync examples inside the published mobile contract", () => {
    const collection = buildMobilePostmanCollection("https://demo.vitavault.test");
    const body = getSyncPostmanBody(collection);

    expect(Object.values(ReadingSource)).toContain(body.source);
    expect(Object.values(DevicePlatform)).toContain(body.platform);
    for (const reading of body.readings) {
      expect(Object.values(DeviceReadingType)).toContain(reading.readingType);
    }
  });

  it("keeps the contract summary aligned with the current mobile surface", () => {
    const summary = getMobileApiContractSummary();

    expect(summary.endpointCount).toBe(MOBILE_DEVICE_ENDPOINTS.length);
    expect(summary.endpoints.map((endpoint) => endpoint.path)).toEqual(MOBILE_DEVICE_ENDPOINTS.map((endpoint) => endpoint.path));
    expect(summary.readingTypeCount).toBe(SUPPORTED_DEVICE_READING_TYPES.length);
    expect(summary.supportedReadings.map((reading) => reading.type).sort()).toEqual(Object.values(DeviceReadingType).sort());
    expect(summary.exportFormats).toContain("OpenAPI 3.1");
    expect(summary.securityPolicies.length).toBeGreaterThanOrEqual(summary.endpointCount);
  });

  it("uses stable downloadable filenames", () => {
    expect(getMobileApiExportFileName("openapi")).toBe("vitavault-mobile-openapi.json");
    expect(getMobileApiExportFileName("postman")).toBe("vitavault-mobile-postman-collection.json");
  });
});
