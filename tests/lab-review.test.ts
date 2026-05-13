import { describe, expect, it, vi } from "vitest";

const LabFlag = {
  NORMAL: "NORMAL",
  BORDERLINE: "BORDERLINE",
  HIGH: "HIGH",
  LOW: "LOW",
} as const;

vi.mock("@prisma/client", () => ({
  DocumentLinkType: { LAB_RESULT: "LAB_RESULT" },
  DocumentType: { LAB_RESULT: "LAB_RESULT" },
  LabFlag,
  ReminderState: { DUE: "DUE", OVERDUE: "OVERDUE", MISSED: "MISSED" },
  ReminderType: { LAB_FOLLOW_UP: "LAB_FOLLOW_UP" },
}));

vi.mock("@/lib/db", () => ({
  db: {},
}));

describe("lab review trend interpretation", () => {
  it("classifies worsening abnormal results as critical review", async () => {
    const {
      getLabInterpretationState,
      getLabReviewReason,
      getLabFollowUpGuidance,
    } = await import("@/lib/lab-review");

    expect(getLabInterpretationState(LabFlag.HIGH, LabFlag.NORMAL)).toBe(
      "critical",
    );
    expect(getLabReviewReason(LabFlag.HIGH, LabFlag.NORMAL)).toContain(
      "abnormal and worse",
    );
    expect(getLabFollowUpGuidance(LabFlag.HIGH, LabFlag.NORMAL)).toContain(
      "Prioritize",
    );
  });

  it("classifies improving results separately from stable results", async () => {
    const {
      getLabInterpretationState,
      getLabTrendDirection,
      getLabTrendLabel,
      getLabTrendTone,
    } = await import("@/lib/lab-review");

    expect(getLabTrendDirection(LabFlag.NORMAL, LabFlag.HIGH)).toBe("improved");
    expect(getLabInterpretationState(LabFlag.NORMAL, LabFlag.HIGH)).toBe(
      "improving",
    );
    expect(getLabTrendLabel("improved")).toBe("Improving");
    expect(getLabTrendTone("improved")).toBe("success");

    expect(getLabTrendDirection(LabFlag.NORMAL, LabFlag.NORMAL)).toBe("stable");
    expect(getLabInterpretationState(LabFlag.NORMAL, LabFlag.NORMAL)).toBe(
      "stable",
    );
  });

  it("builds sorted lab trend cards with display-ready guidance", async () => {
    const { buildLabTrendCards } = await import("@/lib/lab-review");

    const cards = buildLabTrendCards([
      {
        testName: "A1C",
        resultSummary: "7.4%",
        flag: LabFlag.HIGH,
        dateTaken: new Date("2026-04-15"),
      },
      {
        testName: "A1C",
        resultSummary: "5.6%",
        flag: LabFlag.NORMAL,
        dateTaken: new Date("2026-01-15"),
      },
      {
        testName: "Vitamin D",
        resultSummary: "31 ng/mL",
        flag: LabFlag.NORMAL,
        dateTaken: new Date("2026-04-10"),
      },
      {
        testName: "Vitamin D",
        resultSummary: "20 ng/mL",
        flag: LabFlag.LOW,
        dateTaken: new Date("2026-01-10"),
      },
      {
        testName: "LDL",
        resultSummary: "132 mg/dL",
        flag: LabFlag.BORDERLINE,
        dateTaken: new Date("2026-04-01"),
      },
    ]);

    expect(cards[0]).toMatchObject({
      testName: "A1C",
      direction: "worsening",
      interpretationState: "critical",
      trendLabel: "Worsening",
    });
    expect(cards[0].followUpGuidance).toContain("provider review");

    expect(
      cards.find((card) => card.testName === "Vitamin D")?.interpretationState,
    ).toBe("improving");
    expect(
      cards.find((card) => card.testName === "LDL")?.interpretationState,
    ).toBe("watch");
  });

  it("summarizes lab interpretation queues for provider review", async () => {
    const { buildLabInterpretationSummary, buildLabTrendCards } =
      await import("@/lib/lab-review");

    const cards = buildLabTrendCards([
      {
        testName: "A1C",
        resultSummary: "7.4%",
        flag: LabFlag.HIGH,
        dateTaken: new Date("2026-04-15"),
      },
      {
        testName: "A1C",
        resultSummary: "5.6%",
        flag: LabFlag.NORMAL,
        dateTaken: new Date("2026-01-15"),
      },
      {
        testName: "LDL",
        resultSummary: "132 mg/dL",
        flag: LabFlag.BORDERLINE,
        dateTaken: new Date("2026-04-01"),
      },
      {
        testName: "HDL",
        resultSummary: "55 mg/dL",
        flag: LabFlag.NORMAL,
        dateTaken: new Date("2026-04-02"),
      },
      {
        testName: "HDL",
        resultSummary: "52 mg/dL",
        flag: LabFlag.NORMAL,
        dateTaken: new Date("2026-01-02"),
      },
    ]);

    const summary = buildLabInterpretationSummary(cards);

    expect(summary.critical).toBe(1);
    expect(summary.watch).toBe(1);
    expect(summary.stable).toBe(1);
    expect(summary.reviewQueue).toBe(2);
    expect(summary.topState).toBe("critical");
    expect(summary.topLabel).toBe("Critical lab review");
  });
});
