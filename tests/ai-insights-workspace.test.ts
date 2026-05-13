import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));

vi.mock("@prisma/client", () => ({
  AlertSeverity: {
    CRITICAL: "CRITICAL",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW",
  },
  AlertStatus: { OPEN: "OPEN" },
  AppointmentStatus: { UPCOMING: "UPCOMING" },
  LabFlag: {
    NORMAL: "NORMAL",
    HIGH: "HIGH",
    LOW: "LOW",
    BORDERLINE: "BORDERLINE",
  },
  MedicationLogStatus: { MISSED: "MISSED" },
  ReminderState: { DUE: "DUE", OVERDUE: "OVERDUE", MISSED: "MISSED" },
  SymptomSeverity: { SEVERE: "SEVERE" },
}));

import {
  buildAiInsightReviewSignal,
  buildAiReviewQueueSummary,
  buildAiTrustChecklist,
  getAiReviewStateLabel,
  getAiReviewStateTone,
  type ParsedAiInsight,
} from "@/lib/ai-insights-workspace";

const now = new Date("2026-05-12T08:00:00.000Z");

function makeInsight(
  overrides: Partial<ParsedAiInsight> = {},
): ParsedAiInsight {
  return {
    id: "insight-1",
    title: "Weekly care summary",
    summary:
      "Medication adherence, lab context, and vitals are ready for review.",
    adherenceRisk: "low",
    trendFlags: [],
    suggestedQuestions: ["Should we adjust the current plan?"],
    recommendedFollowUp: ["Review the care plan with the doctor."],
    disclaimer: "Informational only and not a diagnosis.",
    createdAt: new Date("2026-05-10T08:00:00.000Z"),
    ...overrides,
  };
}

describe("AI insight review queue helpers", () => {
  it("marks missing insights as a draft review item", () => {
    const signal = buildAiInsightReviewSignal({
      latestInsight: null,
      readinessScore: 90,
      citationCount: 8,
      highPriorityGapCount: 0,
      urgentRiskCount: 0,
      followUpCount: 0,
      now,
    });

    expect(signal).toMatchObject({
      state: "draft",
      label: "Draft needed",
      sourceBacked: false,
      needsClinicianReview: true,
    });
  });

  it("marks stale insights when the latest generated output is older than 30 days", () => {
    const signal = buildAiInsightReviewSignal({
      latestInsight: makeInsight({
        createdAt: new Date("2026-03-01T08:00:00.000Z"),
      }),
      readinessScore: 90,
      citationCount: 8,
      highPriorityGapCount: 0,
      urgentRiskCount: 0,
      followUpCount: 1,
      now,
    });

    expect(signal.state).toBe("stale");
    expect(signal.label).toBe("Stale insight");
    expect(signal.detail).toContain("days old");
  });

  it("requires review for urgent risks or high priority source gaps", () => {
    const signal = buildAiInsightReviewSignal({
      latestInsight: makeInsight(),
      readinessScore: 88,
      citationCount: 7,
      highPriorityGapCount: 1,
      urgentRiskCount: 1,
      followUpCount: 2,
      now,
    });

    expect(signal).toMatchObject({
      state: "needs-review",
      tone: "warning",
      sourceBacked: true,
      needsClinicianReview: true,
    });
  });

  it("marks well-supported recent insights as source-backed", () => {
    const signal = buildAiInsightReviewSignal({
      latestInsight: makeInsight(),
      readinessScore: 92,
      citationCount: 9,
      highPriorityGapCount: 0,
      urgentRiskCount: 0,
      followUpCount: 2,
      now,
    });

    expect(signal).toMatchObject({
      state: "source-backed",
      label: "Source-backed",
      tone: "success",
      sourceBacked: true,
    });
  });

  it("builds trust checklist items for source coverage, readiness, gaps, and clinical boundaries", () => {
    const checklist = buildAiTrustChecklist({
      latestInsight: makeInsight(),
      readinessScore: 62,
      citationCount: 2,
      sourceGapCount: 2,
      highPriorityGapCount: 1,
      urgentRiskCount: 1,
      isAiConfigured: false,
    });

    expect(checklist.map((item) => item.id)).toEqual([
      "source-coverage",
      "readiness",
      "risk-review",
      "data-gaps",
      "clinical-boundary",
      "provider-mode",
    ]);
    expect(checklist.find((item) => item.id === "risk-review")).toMatchObject({
      status: "blocked",
      tone: "danger",
    });
    expect(
      checklist.find((item) => item.id === "provider-mode")?.detail,
    ).toContain("Fallback/demo mode");
  });

  it("summarizes review queue states", () => {
    const summary = buildAiReviewQueueSummary([
      buildAiInsightReviewSignal({
        latestInsight: makeInsight(),
        readinessScore: 92,
        citationCount: 8,
        highPriorityGapCount: 0,
        urgentRiskCount: 0,
        followUpCount: 1,
        now,
      }),
      buildAiInsightReviewSignal({
        latestInsight: null,
        readinessScore: 92,
        citationCount: 8,
        highPriorityGapCount: 0,
        urgentRiskCount: 0,
        followUpCount: 0,
        now,
      }),
      buildAiInsightReviewSignal({
        latestInsight: makeInsight({
          createdAt: new Date("2026-03-01T08:00:00.000Z"),
        }),
        readinessScore: 92,
        citationCount: 8,
        highPriorityGapCount: 0,
        urgentRiskCount: 0,
        followUpCount: 0,
        now,
      }),
    ]);

    expect(summary).toEqual({
      sourceBacked: 1,
      needsReview: 0,
      stale: 1,
      draft: 1,
      blocked: 0,
      total: 3,
    });
  });

  it("exposes stable review labels and tones", () => {
    expect(getAiReviewStateLabel("needs-review")).toBe("Needs review");
    expect(getAiReviewStateTone("blocked")).toBe("danger");
  });
});
