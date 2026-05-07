import { describe, expect, it, vi } from "vitest";
import { DeviceConnectionStatus, DeviceReadingType, ReadingSource, SyncJobStatus } from "@prisma/client";

vi.mock("@/lib/db", () => ({ db: {} }));

describe("device integration helpers", () => {
  it("formats labels, readings, and scopes safely", async () => {
    const { sourceLabel, readingLabel, readingDisplayValue, parseScopes } = await import("@/lib/device-integrations");
    expect(sourceLabel(ReadingSource.ANDROID_HEALTH_CONNECT)).toBe("Android Health Connect");
    expect(readingLabel(DeviceReadingType.OXYGEN_SATURATION)).toBe("Oxygen Saturation");
    expect(parseScopes('["vitals:write","device:sync",123]')).toEqual(["vitals:write", "device:sync"]);
    expect(parseScopes("not-json")).toEqual([]);
    expect(readingDisplayValue({ readingType: DeviceReadingType.BLOOD_PRESSURE, unit: "mmHg", valueInt: null, valueFloat: null, systolic: 120, diastolic: 78 })).toBe("120/78 mmHg");
  });

  it("maps connection and sync states to portfolio-safe tones", async () => {
    const { connectionStatusTone, syncJobStatusTone, buildConnectionHealthSummary } = await import("@/lib/device-integrations");
    expect(connectionStatusTone(DeviceConnectionStatus.ACTIVE)).toBe("success");
    expect(connectionStatusTone(DeviceConnectionStatus.DISCONNECTED)).toBe("warning");
    expect(connectionStatusTone(DeviceConnectionStatus.ERROR)).toBe("danger");
    expect(syncJobStatusTone(SyncJobStatus.SUCCEEDED)).toBe("success");
    expect(syncJobStatusTone(SyncJobStatus.PARTIAL)).toBe("info");
    expect(syncJobStatusTone(SyncJobStatus.FAILED)).toBe("danger");
    expect(buildConnectionHealthSummary({ status: DeviceConnectionStatus.ACTIVE, lastSyncedAt: new Date("2026-05-07T08:00:00.000Z"), lastError: null, _count: { readings: 3, syncJobs: 1, jobRuns: 1 } })).toMatchObject({ tone: "success", label: "Healthy" });
    expect(buildConnectionHealthSummary({ status: DeviceConnectionStatus.ERROR, lastSyncedAt: null, lastError: "Provider token expired." })).toMatchObject({ tone: "danger", label: "Needs review" });
  });

  it("builds a schema-backed QA payload and curl example", async () => {
    const { DEVICE_QA_SAMPLE_PAYLOAD, buildDeviceQaCurl, buildDeviceQaChecklist } = await import("@/lib/device-integrations");
    expect(DEVICE_QA_SAMPLE_PAYLOAD.source).toBe(ReadingSource.ANDROID_HEALTH_CONNECT);
    expect(DEVICE_QA_SAMPLE_PAYLOAD.readings.map((reading) => reading.readingType)).toEqual([DeviceReadingType.HEART_RATE, DeviceReadingType.BLOOD_PRESSURE, DeviceReadingType.WEIGHT]);
    expect(buildDeviceQaCurl("https://example.com")).toContain("/api/mobile/device-readings");
    expect(buildDeviceQaChecklist()).toContain("Confirm a SyncJob records requested, accepted, and mirrored counts.");
  });

  it("parses JSON object metadata without throwing", async () => {
    const { parseJsonObject } = await import("@/lib/device-integrations");
    expect(parseJsonObject('{"simulator":true}')).toEqual({ simulator: true });
    expect(parseJsonObject('["not-object"]')).toBeNull();
    expect(parseJsonObject("bad-json")).toBeNull();
    expect(parseJsonObject(null)).toBeNull();
  });
});
