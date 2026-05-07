import { describe, expect, it } from "vitest";
import {
  buildMobileOpenApiSpec,
  buildMobilePostmanCollection,
  getMobileApiContractSummary,
  getMobileApiExportFileName,
} from "@/lib/mobile-api-contract-export";

const mobileEndpoints = [
  "/api/mobile/auth/login",
  "/api/mobile/auth/me",
  "/api/mobile/auth/logout",
  "/api/mobile/connections",
  "/api/mobile/device-readings",
];

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

  it("keeps the contract summary aligned with the current mobile surface", () => {
    const summary = getMobileApiContractSummary();

    expect(summary.endpointCount).toBe(5);
    expect(summary.readingTypeCount).toBe(7);
    expect(summary.exportFormats).toContain("OpenAPI 3.1");
    expect(summary.securityPolicies.length).toBeGreaterThanOrEqual(5);
  });

  it("uses stable downloadable filenames", () => {
    expect(getMobileApiExportFileName("openapi")).toBe("vitavault-mobile-openapi.json");
    expect(getMobileApiExportFileName("postman")).toBe("vitavault-mobile-postman-collection.json");
  });
});
