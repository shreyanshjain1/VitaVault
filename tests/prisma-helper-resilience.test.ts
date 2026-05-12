import { describe, expect, it, vi } from "vitest";
import {
  DeviceConnectionStatus,
  DeviceReadingType,
  LabFlag,
  ReadingSource,
  SymptomSeverity,
} from "@prisma/client";

vi.mock("@/lib/db", () => ({
  db: {},
}));

vi.mock("@/lib/session", () => ({
  requireUser: vi.fn(),
}));

describe("Prisma-dependent helper resilience", () => {
  it("keeps device integration display helpers usable with a partial Prisma mock", async () => {
    const {
      buildConnectionHealthSummary,
      buildDeviceReliabilitySignal,
      parseJsonObject,
      parseScopes,
      readingDisplayValue,
      readingLabel,
      sourceLabel,
    } = await import("@/lib/device-integrations");

    expect(sourceLabel(ReadingSource.ANDROID_HEALTH_CONNECT)).toBe("Android Health Connect");
    expect(readingLabel(DeviceReadingType.OXYGEN_SATURATION)).toBe("Oxygen Saturation");
    expect(parseScopes('["vitals:write",123,"device:sync"]')).toEqual(["vitals:write", "device:sync"]);
    expect(parseJsonObject('{"ok":true}')).toEqual({ ok: true });
    expect(
      readingDisplayValue({
        readingType: DeviceReadingType.BLOOD_PRESSURE,
        unit: "mmHg",
        valueInt: null,
        valueFloat: null,
        systolic: 121,
        diastolic: 79,
      }),
    ).toBe("121/79 mmHg");
    expect(
      buildConnectionHealthSummary({
        status: DeviceConnectionStatus.ACTIVE,
        lastSyncedAt: new Date("2026-05-12T07:00:00.000Z"),
        lastError: null,
      }),
    ).toMatchObject({ label: "Healthy", tone: "success" });
    expect(
      buildDeviceReliabilitySignal(
        {
          status: DeviceConnectionStatus.ACTIVE,
          lastSyncedAt: new Date("2026-05-12T07:00:00.000Z"),
          lastError: null,
        },
        new Date("2026-05-12T08:00:00.000Z"),
      ),
    ).toMatchObject({ label: "Current", needsReview: false });
  });

  it("keeps simulator helpers usable without mocked Prisma delegates", async () => {
    const {
      buildSimulatorReadings,
      getSimulatorProvider,
      parseSimulatorSource,
      readingDisplayValue,
      vitalDisplayValue,
    } = await import("@/lib/device-sync-simulator");

    expect(parseSimulatorSource("bad-source")).toBe(ReadingSource.APPLE_HEALTH);
    expect(getSimulatorProvider(ReadingSource.SMART_BP_MONITOR).title).toContain("BP");
    expect(buildSimulatorReadings(ReadingSource.SMART_SCALE)).toHaveLength(3);
    expect(
      readingDisplayValue({
        readingType: DeviceReadingType.STEPS,
        unit: "steps",
        valueInt: 5120,
        valueFloat: null,
        systolic: null,
        diastolic: null,
      }),
    ).toBe("5120 steps");
    expect(
      vitalDisplayValue({
        systolic: null,
        diastolic: null,
        heartRate: 72,
        bloodSugar: null,
        oxygenSaturation: 98,
        temperatureC: null,
        weightKg: null,
      }),
    ).toBe("72 bpm • 98% SpO2");
  });

  it("keeps health workflow helper modules free from module-level delegate assumptions", async () => {
    const labReview = await import("@/lib/lab-review");
    const vitalsMonitor = await import("@/lib/vitals-monitor");
    const symptomReview = await import("@/lib/symptom-review");

    expect(labReview.getLabFlagTone(LabFlag.BORDERLINE)).toBe("warning");
    expect(labReview.getLabPriorityTone("critical")).toBe("danger");
    expect(vitalsMonitor.getVitalStatusTone("watch")).toBe("warning");
    expect(vitalsMonitor.getVitalPriorityTone("low")).toBe("neutral");
    expect(symptomReview.getSymptomSeverityTone(SymptomSeverity.SEVERE)).toBe("danger");
    expect(symptomReview.getSymptomPriorityTone("medium")).toBe("info");
  });

  it("keeps report-builder static helpers importable with partial Prisma mocks", async () => {
    const { isSectionSelected, reportSections } = await import("@/lib/report-builder");

    expect(reportSections.length).toBeGreaterThanOrEqual(10);
    expect(isSectionSelected(["profile", "labs"], "labs")).toBe(true);
    expect(isSectionSelected(["profile", "labs"], "careNotes")).toBe(false);
  });
});
