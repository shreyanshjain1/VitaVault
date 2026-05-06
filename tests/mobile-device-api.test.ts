import { describe, expect, it } from "vitest";
import {
  DevicePlatform,
  DeviceReadingType,
  ReadingSource,
} from "@prisma/client";
import {
  SUPPORTED_DEVICE_READING_TYPES,
  mobileDeviceSyncSchema,
} from "@/lib/mobile-device-api";

const basePayload = {
  source: ReadingSource.ANDROID_HEALTH_CONNECT,
  platform: DevicePlatform.ANDROID,
  clientDeviceId: "android-pixel-8-pro",
  deviceLabel: "Pixel 8 Pro",
  appVersion: "1.0.0",
  scopes: ["vitals:write", "device:sync"],
  syncMetadata: {
    batteryLevel: 88,
    network: "wifi",
  },
};

describe("mobile device API contract", () => {
  it("lists only schema-backed device reading types", () => {
    expect(SUPPORTED_DEVICE_READING_TYPES).toEqual([
      DeviceReadingType.HEART_RATE,
      DeviceReadingType.BLOOD_PRESSURE,
      DeviceReadingType.OXYGEN_SATURATION,
      DeviceReadingType.WEIGHT,
      DeviceReadingType.BLOOD_GLUCOSE,
      DeviceReadingType.TEMPERATURE,
      DeviceReadingType.STEPS,
    ]);
    expect(SUPPORTED_DEVICE_READING_TYPES).not.toContain("SLEEP_MINUTES");
  });

  it("accepts a valid mixed reading sync payload", () => {
    const result = mobileDeviceSyncSchema.safeParse({
      ...basePayload,
      readings: [
        {
          readingType: DeviceReadingType.HEART_RATE,
          capturedAt: "2026-04-29T08:35:00.000Z",
          clientReadingId: "hr-001",
          unit: "bpm",
          valueInt: 78,
        },
        {
          readingType: DeviceReadingType.BLOOD_PRESSURE,
          capturedAt: "2026-04-29T08:36:00.000Z",
          clientReadingId: "bp-001",
          unit: "mmHg",
          systolic: 118,
          diastolic: 76,
        },
        {
          readingType: DeviceReadingType.WEIGHT,
          capturedAt: "2026-04-29T08:37:00.000Z",
          clientReadingId: "weight-001",
          unit: "kg",
          valueFloat: 71.4,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsupported sleep readings until the schema adds them", () => {
    const result = mobileDeviceSyncSchema.safeParse({
      ...basePayload,
      readings: [
        {
          readingType: "SLEEP_MINUTES",
          capturedAt: "2026-04-29T08:35:00.000Z",
          clientReadingId: "sleep-001",
          unit: "minutes",
          valueInt: 420,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid capturedAt values as a 400-level validation problem", () => {
    const result = mobileDeviceSyncSchema.safeParse({
      ...basePayload,
      readings: [
        {
          readingType: DeviceReadingType.HEART_RATE,
          capturedAt: "not-a-date",
          clientReadingId: "hr-001",
          unit: "bpm",
          valueInt: 78,
        },
      ],
    });

    if (result.success) {
      throw new Error("Expected invalid capturedAt to fail validation.");
    }

    expect(JSON.stringify(result.error.flatten())).toContain(
      "capturedAt must be a valid ISO date/time value."
    );
  });

  it("enforces required value fields per reading type", () => {
    const result = mobileDeviceSyncSchema.safeParse({
      ...basePayload,
      readings: [
        {
          readingType: DeviceReadingType.BLOOD_GLUCOSE,
          capturedAt: "2026-04-29T08:35:00.000Z",
          clientReadingId: "glucose-001",
          unit: "mg/dL",
        },
      ],
    });

    if (result.success) {
      throw new Error("Expected missing valueFloat to fail validation.");
    }

    expect(JSON.stringify(result.error.flatten())).toContain(
      "BLOOD_GLUCOSE requires valueFloat."
    );
  });
});
