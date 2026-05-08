import { describe, expect, it } from "vitest";
import { DevicePlatform, DeviceReadingType, ReadingSource } from "@prisma/client";
import {
  buildProviderCapabilitySummary,
  buildProviderSamplePayload,
  connectorCategoryLabel,
  connectorStatusLabel,
  getDeviceProviderConnector,
  getDeviceProviderConnectors,
  getProviderSetupChecklist,
} from "@/lib/device-provider-connectors";
import { mobileDeviceSyncSchema } from "@/lib/mobile-device-api";

describe("device provider connectors", () => {
  it("covers the schema-backed provider sources used by device integrations", () => {
    const sources = getDeviceProviderConnectors().map((connector) => connector.source);

    expect(sources).toContain(ReadingSource.ANDROID_HEALTH_CONNECT);
    expect(sources).toContain(ReadingSource.APPLE_HEALTH);
    expect(sources).toContain(ReadingSource.FITBIT);
    expect(sources).toContain(ReadingSource.SMART_BP_MONITOR);
    expect(sources).toContain(ReadingSource.SMART_SCALE);
    expect(sources).toContain(ReadingSource.PULSE_OXIMETER);
    expect(sources).toContain(ReadingSource.OTHER);
  });

  it("summarizes connector readiness and supported reading coverage", () => {
    const summary = buildProviderCapabilitySummary();

    expect(summary.totalConnectors).toBeGreaterThanOrEqual(7);
    expect(summary.readyConnectors).toBeGreaterThanOrEqual(4);
    expect(summary.supportedReadingTypes).toBeGreaterThanOrEqual(7);
    expect(summary.uniqueSources).toBe(summary.totalConnectors);
  });

  it("returns connector labels for dashboard rendering", () => {
    expect(connectorStatusLabel("ready")).toBe("API-ready");
    expect(connectorStatusLabel("simulated")).toBe("Adapter contract");
    expect(connectorCategoryLabel("phone_health_platform")).toBe("Phone health platform");
  });

  it("builds valid sample payloads for provider preview cards", () => {
    const payload = buildProviderSamplePayload(ReadingSource.SMART_BP_MONITOR);
    const parsed = mobileDeviceSyncSchema.safeParse(payload);

    expect(parsed.success).toBe(true);
    expect(payload.source).toBe(ReadingSource.SMART_BP_MONITOR);
    expect(payload.platform).toBe(DevicePlatform.ANDROID);
    expect(payload.readings[0].readingType).toBe(DeviceReadingType.BLOOD_PRESSURE);
  });

  it("exposes setup checklist details for known and unknown providers", () => {
    const known = getProviderSetupChecklist(ReadingSource.ANDROID_HEALTH_CONNECT);
    const unknown = getProviderSetupChecklist("UNLISTED_PROVIDER");

    expect(known.length).toBeGreaterThan(2);
    expect(known.join(" ")).toContain("Health Connect");
    expect(unknown[0]).toContain("Prisma ReadingSource enum");
  });

  it("returns null for unsupported connector lookups", () => {
    expect(getDeviceProviderConnector("SLEEP_TRACKER")).toBeNull();
  });
});
