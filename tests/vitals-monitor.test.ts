import { describe, expect, it, vi } from "vitest";

vi.mock("@prisma/client", () => ({
  AlertSeverity: {
    CRITICAL: "CRITICAL",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW",
  },
  AlertSourceType: { VITAL_RECORD: "VITAL_RECORD" },
  AlertStatus: { OPEN: "OPEN" },
  ReadingSource: { MANUAL: "MANUAL" },
}));

vi.mock("@/lib/db", () => ({
  db: {},
}));

describe("vitals monitor risk signals", () => {
  it("classifies urgent vital readings as critical review", async () => {
    const { buildVitalMetricSignal } = await import("@/lib/vitals-monitor");
    const now = new Date("2026-05-13T08:00:00.000Z");

    const signal = buildVitalMetricSignal(
      {
        key: "bloodPressure",
        title: "Blood pressure",
        latest: "182/122 mmHg",
        status: "danger",
        capturedAt: new Date("2026-05-13T07:00:00.000Z"),
      },
      now,
    );

    expect(signal.riskState).toBe("critical");
    expect(signal.riskLabel).toBe("Critical review");
    expect(signal.freshnessState).toBe("current");
    expect(signal.riskReason).toContain("urgent review range");
  });

  it("marks older normal readings as stale even when the value is stable", async () => {
    const { buildVitalMetricSignal } = await import("@/lib/vitals-monitor");
    const now = new Date("2026-05-13T08:00:00.000Z");

    const signal = buildVitalMetricSignal(
      {
        key: "oxygen",
        title: "Oxygen saturation",
        latest: "98% SpO2",
        status: "normal",
        capturedAt: new Date("2026-04-01T08:00:00.000Z"),
      },
      now,
    );

    expect(signal.freshnessState).toBe("stale");
    expect(signal.riskState).toBe("stale");
    expect(signal.riskLabel).toBe("Fresh reading due");
    expect(signal.nextStep).toContain("fresh reading");
  });

  it("marks missing metric values as missing readings", async () => {
    const { buildVitalMetricSignal } = await import("@/lib/vitals-monitor");

    const signal = buildVitalMetricSignal({
      key: "heartRate",
      title: "Heart rate",
      latest: "No reading",
      status: "missing",
      capturedAt: null,
    });

    expect(signal.freshnessState).toBe("missing");
    expect(signal.riskState).toBe("missing");
    expect(signal.riskLabel).toBe("Missing reading");
  });

  it("summarizes critical, stale, missing, and stable metric cards", async () => {
    const { buildVitalMetricSignal, buildVitalRiskSummary } =
      await import("@/lib/vitals-monitor");
    const now = new Date("2026-05-13T08:00:00.000Z");

    const baseMetrics = [
      {
        key: "bloodPressure" as const,
        title: "Blood pressure",
        latest: "180/120 mmHg",
        previous: null,
        delta: null,
        capturedAt: new Date("2026-05-13T07:00:00.000Z"),
        status: "danger" as const,
        detail: "BP review",
      },
      {
        key: "oxygen" as const,
        title: "Oxygen saturation",
        latest: "98% SpO2",
        previous: null,
        delta: null,
        capturedAt: new Date("2026-04-01T08:00:00.000Z"),
        status: "normal" as const,
        detail: "Oxygen review",
      },
      {
        key: "temperature" as const,
        title: "Temperature",
        latest: "No reading",
        previous: null,
        delta: null,
        capturedAt: null,
        status: "missing" as const,
        detail: "Temperature review",
      },
      {
        key: "weight" as const,
        title: "Weight",
        latest: "70 kg",
        previous: null,
        delta: null,
        capturedAt: new Date("2026-05-12T08:00:00.000Z"),
        status: "normal" as const,
        detail: "Weight review",
      },
    ].map((metric) => ({
      ...metric,
      ...buildVitalMetricSignal(
        {
          key: metric.key,
          title: metric.title,
          latest: metric.latest,
          status: metric.status,
          capturedAt: metric.capturedAt,
        },
        now,
      ),
    }));

    expect(buildVitalRiskSummary(baseMetrics)).toEqual({
      critical: 1,
      warning: 0,
      stale: 1,
      missing: 1,
      stable: 1,
      needsReview: 3,
    });
  });
});
