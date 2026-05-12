import { alertCategoryLabel, alertSeverityLabel, alertStatusLabel } from "@/lib/alerts/constants";

export type AlertWorkflowTone = "neutral" | "info" | "success" | "warning" | "danger";

export type AlertWorkflowInput = {
  status: string;
  severity: string;
  category: string;
  visibleToCareTeam: boolean;
  createdAt: Date | string;
  ownerAcknowledgedAt?: Date | string | null;
  resolvedAt?: Date | string | null;
  dismissedAt?: Date | string | null;
};

export type AlertTriageState = {
  key: "urgent" | "needs_review" | "in_review" | "closed" | "dismissed";
  label: string;
  tone: AlertWorkflowTone;
  nextAction: string;
  checklist: string[];
};

export type AlertVisibilitySignal = {
  label: string;
  tone: AlertWorkflowTone;
  description: string;
};

export type AlertWorkflowSummary = {
  total: number;
  urgent: number;
  needsReview: number;
  inReview: number;
  closed: number;
  careTeamVisible: number;
};

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function severityTone(severity: string): AlertWorkflowTone {
  if (severity === "CRITICAL") return "danger";
  if (severity === "HIGH") return "warning";
  if (severity === "MEDIUM") return "info";
  return "neutral";
}

export function formatAlertLabel(value: string, labels: Record<string, string>) {
  return labels[value] ?? value.replaceAll("_", " ").toLowerCase().replace(/^\w/, (match) => match.toUpperCase());
}

export function formatAlertAge(value: Date | string, now: Date = new Date()) {
  const date = toDate(value);
  if (!date) return "Unknown age";

  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function buildAlertTriageState(alert: AlertWorkflowInput): AlertTriageState {
  const severity = alert.severity;
  const status = alert.status;

  if (status === "RESOLVED") {
    return {
      key: "closed",
      label: "Resolved",
      tone: "success",
      nextAction: "Keep the audit trail for the care record and monitor for repeat triggers.",
      checklist: ["Resolution timestamp captured", "Audit trail preserved", "Source record remains linked"],
    };
  }

  if (status === "DISMISSED") {
    return {
      key: "dismissed",
      label: "Dismissed",
      tone: "neutral",
      nextAction: "No active follow-up is required unless the same rule triggers again.",
      checklist: ["Dismissal timestamp captured", "Reason can be reviewed in audit notes", "Rule remains available for future monitoring"],
    };
  }

  if (status === "ACKNOWLEDGED") {
    return {
      key: "in_review",
      label: "In review",
      tone: "info",
      nextAction: "Finish the review by resolving the alert or dismissing it with context.",
      checklist: ["Owner acknowledged the alert", "Review note can be added", "Resolve or dismiss after source review"],
    };
  }

  if (severity === "CRITICAL" || severity === "HIGH") {
    return {
      key: "urgent",
      label: severity === "CRITICAL" ? "Urgent triage" : "High-priority triage",
      tone: severity === "CRITICAL" ? "danger" : "warning",
      nextAction: "Acknowledge the alert, inspect the linked source record, and decide whether care-team visibility is needed.",
      checklist: ["Acknowledge owner review", "Open linked source", "Resolve, dismiss, or escalate to care team"],
    };
  }

  return {
    key: "needs_review",
    label: "Needs review",
    tone: severity === "MEDIUM" ? "info" : "neutral",
    nextAction: "Review the linked source and acknowledge the event when it has been checked.",
    checklist: ["Review source context", "Add audit note if needed", "Resolve or dismiss after checking"],
  };
}

export function buildAlertVisibilitySignal(alert: Pick<AlertWorkflowInput, "visibleToCareTeam" | "status">): AlertVisibilitySignal {
  if (!alert.visibleToCareTeam) {
    return {
      label: "Owner only",
      tone: "neutral",
      description: "This alert is not exposed to care-team workspaces unless sharing rules change.",
    };
  }

  if (alert.status === "RESOLVED" || alert.status === "DISMISSED") {
    return {
      label: "Care-team history",
      tone: "success",
      description: "Care-team users can see this alert as resolved/dismissed history when they have alert visibility.",
    };
  }

  return {
    label: "Care-team visible",
    tone: "info",
    description: "Care-team users with record visibility can use this as part of the shared review workflow.",
  };
}

export function buildAlertWorkflowSummary(alerts: AlertWorkflowInput[]): AlertWorkflowSummary {
  return alerts.reduce<AlertWorkflowSummary>(
    (summary, alert) => {
      const triage = buildAlertTriageState(alert);
      summary.total += 1;
      if (triage.key === "urgent") summary.urgent += 1;
      if (triage.key === "needs_review") summary.needsReview += 1;
      if (triage.key === "in_review") summary.inReview += 1;
      if (triage.key === "closed" || triage.key === "dismissed") summary.closed += 1;
      if (alert.visibleToCareTeam) summary.careTeamVisible += 1;
      return summary;
    },
    { total: 0, urgent: 0, needsReview: 0, inReview: 0, closed: 0, careTeamVisible: 0 },
  );
}

export function buildAlertWorkflowCard(alert: AlertWorkflowInput) {
  const triage = buildAlertTriageState(alert);
  const visibility = buildAlertVisibilitySignal(alert);

  return {
    triage,
    visibility,
    ageLabel: formatAlertAge(alert.createdAt),
    statusLabel: formatAlertLabel(alert.status, alertStatusLabel),
    severityLabel: formatAlertLabel(alert.severity, alertSeverityLabel),
    categoryLabel: formatAlertLabel(alert.category, alertCategoryLabel),
  };
}
