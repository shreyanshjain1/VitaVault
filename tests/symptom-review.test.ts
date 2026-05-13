import { describe, expect, it } from "vitest";
import { SymptomSeverity } from "@prisma/client";
import {
  buildSymptomPatternCards,
  buildSymptomPatternSummary,
  buildSymptomPatternChecklist,
  getDominantSymptomTrigger,
  getSymptomCadenceLabel,
  getSymptomPatternLabel,
  getSymptomPatternNextStep,
  getSymptomPatternState,
  getSymptomPatternTone,
  getSymptomSeverityTrail,
} from "@/lib/symptom-review";

type PatternInput = Parameters<typeof getSymptomPatternState>[0][number];

const now = new Date("2026-05-13T00:00:00.000Z");

function daysAgo(days: number) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date;
}

function symptom(overrides: Partial<PatternInput> = {}): PatternInput {
  return {
    id: overrides.id ?? "symptom-1",
    title: overrides.title ?? "Headache",
    severity: overrides.severity ?? SymptomSeverity.MILD,
    bodyArea: overrides.bodyArea ?? "Head",
    trigger: overrides.trigger ?? null,
    notes: overrides.notes ?? "Started after long screen time.",
    resolved: overrides.resolved ?? false,
    startedAt: overrides.startedAt ?? daysAgo(2),
  };
}

describe("symptom pattern review helpers", () => {
  it("classifies a latest higher-severity unresolved pattern as worsening", () => {
    const entries = [
      symptom({
        id: "mild",
        severity: SymptomSeverity.MILD,
        startedAt: daysAgo(14),
        resolved: true,
      }),
      symptom({
        id: "severe",
        severity: SymptomSeverity.SEVERE,
        startedAt: daysAgo(1),
        resolved: false,
      }),
    ];

    expect(getSymptomPatternState(entries, now)).toBe("worsening");
    expect(getSymptomPatternLabel("worsening")).toBe("Worsening pattern");
    expect(getSymptomPatternTone("worsening")).toBe("danger");
  });

  it("classifies repeated unresolved entries as recurring", () => {
    const entries = [
      symptom({
        id: "one",
        severity: SymptomSeverity.MILD,
        startedAt: daysAgo(20),
      }),
      symptom({
        id: "two",
        severity: SymptomSeverity.MILD,
        startedAt: daysAgo(10),
      }),
      symptom({
        id: "three",
        severity: SymptomSeverity.MILD,
        startedAt: daysAgo(2),
      }),
    ];

    expect(getSymptomPatternState(entries, now)).toBe("recurring");
    expect(getSymptomPatternNextStep("recurring")).toContain("common trigger");
  });

  it("classifies old unresolved entries as stale open", () => {
    const entries = [
      symptom({ id: "old", startedAt: daysAgo(25), resolved: false }),
    ];

    expect(getSymptomPatternState(entries, now)).toBe("stale-open");
  });

  it("builds cadence, trigger, and severity trail labels for repeated symptoms", () => {
    const entries = [
      symptom({
        id: "one",
        trigger: "Screen time",
        severity: SymptomSeverity.MILD,
        startedAt: daysAgo(6),
      }),
      symptom({
        id: "two",
        trigger: "Screen time",
        severity: SymptomSeverity.MODERATE,
        startedAt: daysAgo(3),
      }),
      symptom({
        id: "three",
        trigger: "Dehydration",
        severity: SymptomSeverity.SEVERE,
        startedAt: daysAgo(1),
      }),
    ];

    expect(getSymptomCadenceLabel(entries, now)).toBe("3 entries in one week");
    expect(getDominantSymptomTrigger(entries)).toBe("Screen time (2x)");
    expect(getSymptomSeverityTrail(entries)).toBe("mild → moderate → severe");
  });

  it("builds review checklist items for stale and under-documented patterns", () => {
    const entries = [
      symptom({
        id: "old-open",
        trigger: "",
        notes: "",
        startedAt: daysAgo(30),
        resolved: false,
      }),
      symptom({
        id: "recent",
        trigger: "",
        notes: "",
        startedAt: daysAgo(3),
        resolved: false,
      }),
    ];

    expect(buildSymptomPatternChecklist(entries, "stale-open", now)).toEqual(
      expect.arrayContaining([
        "Refresh or resolve the oldest open symptom entry.",
        "Add context notes for impact, duration, and self-care actions.",
        "Record possible triggers to make the pattern easier to explain.",
      ]),
    );
  });

  it("builds grouped cards and summary counts for provider review", () => {
    const cards = buildSymptomPatternCards(
      [
        symptom({
          id: "head-old",
          bodyArea: "Head",
          severity: SymptomSeverity.MILD,
          startedAt: daysAgo(14),
          resolved: true,
        }),
        symptom({
          id: "head-new",
          bodyArea: "Head",
          severity: SymptomSeverity.SEVERE,
          startedAt: daysAgo(1),
          resolved: false,
        }),
        symptom({
          id: "chest-old",
          bodyArea: "Chest",
          severity: SymptomSeverity.MILD,
          startedAt: daysAgo(28),
          resolved: false,
        }),
        symptom({
          id: "skin",
          bodyArea: "Skin",
          severity: SymptomSeverity.MILD,
          startedAt: daysAgo(6),
          resolved: true,
        }),
      ],
      now,
    );

    expect(cards.map((card) => card.state)).toEqual([
      "worsening",
      "stale-open",
      "resolved",
    ]);
    expect(cards[0]).toMatchObject({
      label: "Head",
      stateLabel: "Worsening pattern",
      tone: "danger",
      cadenceLabel: "About every 13 days",
      severityTrail: "mild → severe",
    });
    expect(cards[0].reviewChecklist).toContain(
      "Flag this pattern for provider review before the next visit.",
    );

    const summary = buildSymptomPatternSummary(cards);
    expect(summary).toMatchObject({
      totalPatterns: 3,
      reviewQueue: 2,
      actionRequired: 2,
      worsening: 1,
      highSeverity: 0,
      staleOpen: 1,
      resolved: 1,
      stable: 0,
    });
  });
});
