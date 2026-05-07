import { describe, expect, it } from "vitest";
import {
  careNotePreShareStatus,
  careNoteWorkflowRisk,
  careNoteWorkflowTone,
  summarizeCareNoteForWorkflow,
  trimWorkflowText,
} from "@/lib/care-note-workflows";

describe("care note workflow helpers", () => {
  it("maps urgent and high-priority notes into handoff risk levels", () => {
    expect(careNoteWorkflowTone("URGENT")).toBe("danger");
    expect(careNoteWorkflowRisk("URGENT")).toBe("urgent");
    expect(careNoteWorkflowTone("HIGH")).toBe("warning");
    expect(careNoteWorkflowRisk("HIGH")).toBe("watch");
    expect(careNoteWorkflowTone("NORMAL")).toBe("info");
    expect(careNoteWorkflowRisk("NORMAL")).toBe("routine");
  });

  it("builds a compact note summary for timeline and report usage", () => {
    const summary = summarizeCareNoteForWorkflow({
      title: "Medication dizziness follow-up",
      body: "Patient reported dizziness after evening dose. Ask doctor if dose timing should change.",
      category: "MEDICATION",
      priority: "HIGH",
      visibility: "CARE_TEAM",
      pinned: true,
      authorName: "Nurse Ana",
    });

    expect(summary).toContain("Pinned");
    expect(summary).toContain("High");
    expect(summary).toContain("Medication");
    expect(summary).toContain("Care Team");
    expect(summary).toContain("By Nurse Ana");
  });

  it("summarizes pre-share status for urgent care notes", () => {
    const status = careNotePreShareStatus([
      { priority: "NORMAL" },
      { priority: "URGENT", pinned: true },
    ]);

    expect(status.priority).toBe("high");
    expect(status.status).toBe("attention");
    expect(status.title).toContain("urgent care notes");
  });

  it("trims long note text without losing a readable ending", () => {
    const trimmed = trimWorkflowText("Follow-up ".repeat(40), 60);

    expect(trimmed.length).toBeLessThanOrEqual(60);
    expect(trimmed.endsWith("…")).toBe(true);
  });
});
