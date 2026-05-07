export type CareNoteWorkflowPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type CareNoteWorkflowCategory = "GENERAL" | "MEDICATION" | "LAB" | "SYMPTOM" | "APPOINTMENT" | "CARE_PLAN" | "FAMILY" | "ADMINISTRATIVE";
export type CareNoteWorkflowVisibility = "PRIVATE" | "CARE_TEAM" | "PROVIDERS";

export type CareNoteWorkflowTone = "info" | "neutral" | "success" | "warning" | "danger";
export type CareNoteWorkflowRisk = "routine" | "watch" | "urgent";

export type CareNoteWorkflowInput = {
  title: string;
  body: string;
  category: CareNoteWorkflowCategory;
  priority: CareNoteWorkflowPriority;
  visibility: CareNoteWorkflowVisibility;
  pinned?: boolean;
  authorName?: string | null;
};

export function careNoteWorkflowTone(priority: CareNoteWorkflowPriority): CareNoteWorkflowTone {
  if (priority === "URGENT") return "danger";
  if (priority === "HIGH") return "warning";
  if (priority === "LOW") return "neutral";
  return "info";
}

export function careNoteWorkflowRisk(priority: CareNoteWorkflowPriority): CareNoteWorkflowRisk {
  if (priority === "URGENT") return "urgent";
  if (priority === "HIGH") return "watch";
  return "routine";
}

export function careNoteWorkflowLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export function trimWorkflowText(value: string, maxLength = 180) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

export function summarizeCareNoteForWorkflow(note: CareNoteWorkflowInput) {
  const parts = [
    note.pinned ? "Pinned" : null,
    careNoteWorkflowLabel(note.priority),
    careNoteWorkflowLabel(note.category),
    careNoteWorkflowLabel(note.visibility),
    note.authorName ? `By ${note.authorName}` : null,
    trimWorkflowText(note.body),
  ];

  return parts.filter(Boolean).join(" • ");
}

export function countCareNoteRisks(notes: Array<{ priority: CareNoteWorkflowPriority; pinned?: boolean }>) {
  return {
    total: notes.length,
    pinned: notes.filter((note) => note.pinned).length,
    urgent: notes.filter((note) => note.priority === "URGENT").length,
    watch: notes.filter((note) => note.priority === "HIGH").length,
  };
}

export function careNotePreShareStatus(notes: Array<{ priority: CareNoteWorkflowPriority; pinned?: boolean }>) {
  const counts = countCareNoteRisks(notes);

  if (counts.urgent > 0) {
    return {
      priority: "high" as const,
      status: "attention" as const,
      title: "Review urgent care notes before sharing",
      description: `${counts.urgent} urgent care note${counts.urgent === 1 ? "" : "s"} should be acknowledged before exporting a handoff packet.`,
    };
  }

  if (counts.watch > 0 || counts.pinned > 0) {
    return {
      priority: "medium" as const,
      status: "review" as const,
      title: "Include care-note context in the handoff",
      description: `${counts.watch + counts.pinned} high-priority or pinned note${counts.watch + counts.pinned === 1 ? "" : "s"} can improve care-team continuity.`,
    };
  }

  return {
    priority: "low" as const,
    status: "ready" as const,
    title: "Care-note context is ready",
    description: counts.total > 0 ? `${counts.total} recent care note${counts.total === 1 ? "" : "s"} can be included in reports and timeline review.` : "No recent care notes need attention.",
  };
}
