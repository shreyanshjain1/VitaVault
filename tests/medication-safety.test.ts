import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {},
}));

vi.mock("@prisma/client", () => ({
  AlertRuleCategory: { MEDICATION_ADHERENCE: "MEDICATION_ADHERENCE" },
  AlertSeverity: {
    CRITICAL: "CRITICAL",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW",
  },
  AlertSourceType: { MEDICATION_LOG: "MEDICATION_LOG" },
  AlertStatus: { OPEN: "OPEN" },
  MedicationLogStatus: { TAKEN: "TAKEN", MISSED: "MISSED", SKIPPED: "SKIPPED" },
  MedicationStatus: { ACTIVE: "ACTIVE" },
  ReminderState: { DUE: "DUE", OVERDUE: "OVERDUE", MISSED: "MISSED" },
  ReminderType: { MEDICATION: "MEDICATION" },
}));

describe("medication safety interaction review helpers", () => {
  it("classifies expired active medications as critical", async () => {
    const { getMedicationAdherenceSignal } =
      await import("@/lib/medication-safety");

    const signal = getMedicationAdherenceSignal({
      adherence: 100,
      logged: 8,
      missed: 0,
      skipped: 0,
      scheduleCount: 1,
      daysUntilEnd: -2,
      hasDoctor: true,
    });

    expect(signal.state).toBe("critical");
    expect(signal.tone).toBe("danger");
    expect(signal.action).toContain("completed");
  });

  it("flags medications with missing schedules or low adherence for review", async () => {
    const { getMedicationAdherenceSignal } =
      await import("@/lib/medication-safety");

    expect(
      getMedicationAdherenceSignal({
        adherence: 100,
        logged: 5,
        missed: 0,
        skipped: 0,
        scheduleCount: 0,
        daysUntilEnd: null,
        hasDoctor: true,
      }).state,
    ).toBe("needs-review");

    const lowAdherence = getMedicationAdherenceSignal({
      adherence: 58,
      logged: 12,
      missed: 4,
      skipped: 1,
      scheduleCount: 2,
      daysUntilEnd: null,
      hasDoctor: true,
    });

    expect(lowAdherence.state).toBe("needs-review");
    expect(lowAdherence.reason).toContain("missed or skipped");
  });

  it("separates insufficient data, monitor, and stable states", async () => {
    const { getMedicationAdherenceSignal } =
      await import("@/lib/medication-safety");

    expect(
      getMedicationAdherenceSignal({
        adherence: 0,
        logged: 0,
        missed: 0,
        skipped: 0,
        scheduleCount: 1,
        daysUntilEnd: null,
        hasDoctor: true,
      }).state,
    ).toBe("insufficient-data");

    expect(
      getMedicationAdherenceSignal({
        adherence: 82,
        logged: 10,
        missed: 1,
        skipped: 0,
        scheduleCount: 1,
        daysUntilEnd: 10,
        hasDoctor: false,
      }).state,
    ).toBe("monitor");

    expect(
      getMedicationAdherenceSignal({
        adherence: 95,
        logged: 20,
        missed: 1,
        skipped: 0,
        scheduleCount: 2,
        daysUntilEnd: 90,
        hasDoctor: true,
      }).state,
    ).toBe("stable");
  });

  it("builds a reviewer-friendly medication summary", async () => {
    const { buildMedicationReviewSummary } =
      await import("@/lib/medication-safety");

    const summary = buildMedicationReviewSummary([
      {
        reviewSignal: {
          state: "critical",
          label: "Critical review",
          tone: "danger",
          reason: "Expired",
          action: "Review",
        },
      },
      {
        reviewSignal: {
          state: "needs-review",
          label: "Needs review",
          tone: "warning",
          reason: "Missed",
          action: "Review",
        },
      },
      {
        reviewSignal: {
          state: "monitor",
          label: "Monitor",
          tone: "info",
          reason: "Ending soon",
          action: "Monitor",
        },
      },
      {
        reviewSignal: {
          state: "stable",
          label: "Stable",
          tone: "success",
          reason: "Ready",
          action: "Continue",
        },
      },
      {
        reviewSignal: {
          state: "insufficient-data",
          label: "Insufficient data",
          tone: "neutral",
          reason: "No logs",
          action: "Log",
        },
      },
    ]);

    expect(summary.label).toBe("Critical medication review");
    expect(summary.reviewQueue).toBe(4);
    expect(summary.critical).toBe(1);
    expect(summary.needsReview).toBe(1);
    expect(summary.monitor).toBe(1);
    expect(summary.insufficientData).toBe(1);
    expect(summary.stable).toBe(1);
  });
});
