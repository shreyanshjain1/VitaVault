import { describe, expect, it, vi } from "vitest";
import { DeviceReadingType, ReadingSource } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  db: {},
}));

describe("device sync simulator helpers", () => {
  it("falls back to Apple Health for invalid simulator sources", async () => {
    const { parseSimulatorSource, getSimulatorProvider } = await import("@/lib/device-sync-simulator");

    expect(parseSimulatorSource(null)).toBe(ReadingSource.APPLE_HEALTH);
    expect(parseSimulatorSource("not-a-provider")).toBe(ReadingSource.APPLE_HEALTH);
    expect(parseSimulatorSource(ReadingSource.SMART_SCALE)).toBe(ReadingSource.SMART_SCALE);

    expect(getSimulatorProvider(ReadingSource.SMART_BP_MONITOR).title).toContain("BP");
  });

  it("builds provider-specific simulator readings", async () => {
    const { buildSimulatorReadings } = await import("@/lib/device-sync-simulator");

    const bpReadings = buildSimulatorReadings(ReadingSource.SMART_BP_MONITOR);
    const scaleReadings = buildSimulatorReadings(ReadingSource.SMART_SCALE);

    expect(bpReadings.some((reading) => reading.readingType === DeviceReadingType.BLOOD_PRESSURE)).toBe(true);
    expect(bpReadings.some((reading) => reading.readingType === DeviceReadingType.HEART_RATE)).toBe(true);
    expect(scaleReadings.every((reading) => reading.readingType === DeviceReadingType.WEIGHT)).toBe(true);
  });

  it("formats reading labels and display values", async () => {
    const { readingDisplayValue, readingLabel } = await import("@/lib/device-sync-simulator");

    expect(readingLabel(DeviceReadingType.OXYGEN_SATURATION)).toBe("Oxygen Saturation");
    expect(
      readingDisplayValue({
        readingType: DeviceReadingType.BLOOD_PRESSURE,
        unit: "mmHg",
        valueInt: null,
        valueFloat: null,
        systolic: 128,
        diastolic: 82,
      })
    ).toBe("128/82 mmHg");
    expect(
      readingDisplayValue({
        readingType: DeviceReadingType.STEPS,
        unit: "steps",
        valueInt: 8120,
        valueFloat: null,
        systolic: null,
        diastolic: null,
      })
    ).toBe("8120 steps");
    expect(
      readingDisplayValue({
        readingType: DeviceReadingType.WEIGHT,
        unit: "kg",
        valueInt: null,
        valueFloat: null,
        systolic: null,
        diastolic: null,
      })
    ).toBe("—");
  });
});
