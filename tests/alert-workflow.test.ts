import { describe, expect, it } from "vitest";
import {
  buildAlertTriageState,
  buildAlertVisibilitySignal,
  buildAlertWorkflowCard,
  buildAlertWorkflowSummary,
  formatAlertAge,
} from "@/lib/alerts/workflow";

const now = new Date("2026-05-12T04:00:00.000Z");

describe("alert workflow helpers", () => {
  it("classifies open critical alerts as urgent triage", () => {
    const state = buildAlertTriageState({
      status: "OPEN",
      severity: "CRITICAL",
      category: "VITAL_THRESHOLD",
      visibleToCareTeam: true,
      createdAt: new Date("2026-05-12T03:00:00.000Z"),
    });

    expect(state.key).toBe("urgent");
    expect(state.tone).toBe("danger");
    expect(state.checklist).toContain("Acknowledge owner review");
  });

  it("classifies acknowledged alerts as in review", () => {
    const state = buildAlertTriageState({
      status: "ACKNOWLEDGED",
      severity: "HIGH",
      category: "SYNC_HEALTH",
      visibleToCareTeam: true,
      createdAt: new Date("2026-05-12T02:00:00.000Z"),
      ownerAcknowledgedAt: new Date("2026-05-12T02:30:00.000Z"),
    });

    expect(state.key).toBe("in_review");
    expect(state.label).toBe("In review");
    expect(state.nextAction).toContain("resolving");
  });

  it("builds care-team visibility signals", () => {
    expect(buildAlertVisibilitySignal({ status: "OPEN", visibleToCareTeam: true })).toMatchObject({
      label: "Care-team visible",
      tone: "info",
    });

    expect(buildAlertVisibilitySignal({ status: "OPEN", visibleToCareTeam: false })).toMatchObject({
      label: "Owner only",
      tone: "neutral",
    });

    expect(buildAlertVisibilitySignal({ status: "RESOLVED", visibleToCareTeam: true })).toMatchObject({
      label: "Care-team history",
      tone: "success",
    });
  });

  it("summarizes alert workflow states", () => {
    const summary = buildAlertWorkflowSummary([
      { status: "OPEN", severity: "CRITICAL", category: "VITAL_THRESHOLD", visibleToCareTeam: true, createdAt: now },
      { status: "OPEN", severity: "MEDIUM", category: "SYNC_HEALTH", visibleToCareTeam: false, createdAt: now },
      { status: "ACKNOWLEDGED", severity: "HIGH", category: "SYMPTOM_SEVERITY", visibleToCareTeam: true, createdAt: now },
      { status: "RESOLVED", severity: "LOW", category: "MEDICATION_ADHERENCE", visibleToCareTeam: true, createdAt: now },
    ]);

    expect(summary).toEqual({
      total: 4,
      urgent: 1,
      needsReview: 1,
      inReview: 1,
      closed: 1,
      careTeamVisible: 3,
    });
  });

  it("builds display-ready alert workflow cards", () => {
    const card = buildAlertWorkflowCard({
      status: "OPEN",
      severity: "HIGH",
      category: "VITAL_THRESHOLD",
      visibleToCareTeam: true,
      createdAt: now,
    });

    expect(card.statusLabel).toBe("Open");
    expect(card.severityLabel).toBe("High");
    expect(card.categoryLabel).toBe("Vital threshold");
    expect(card.triage.label).toBe("High-priority triage");
  });

  it("formats alert age labels", () => {
    expect(formatAlertAge("2026-05-12T03:59:45.000Z", now)).toBe("Just now");
    expect(formatAlertAge("2026-05-12T03:30:00.000Z", now)).toBe("30m ago");
    expect(formatAlertAge("2026-05-12T01:00:00.000Z", now)).toBe("3h ago");
    expect(formatAlertAge("2026-05-10T04:00:00.000Z", now)).toBe("2d ago");
  });
});
