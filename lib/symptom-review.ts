import { AlertSourceType, AlertStatus, ReminderState, SymptomSeverity } from "@prisma/client";
import { db } from "@/lib/db";

export type SymptomReviewTone = "neutral" | "info" | "success" | "warning" | "danger";
export type SymptomReviewPriority = "critical" | "high" | "medium" | "low";

export type SymptomCluster = {
  key: string;
  label: string;
  count: number;
  unresolved: number;
  severe: number;
  latestAt: Date;
  tone: SymptomReviewTone;
};

export type SymptomActionItem = {
  id: string;
  title: string;
  detail: string;
  priority: SymptomReviewPriority;
  href: string;
};

export type SymptomTimelineItem = {
  id: string;
  title: string;
  detail: string;
  at: Date;
  severity: SymptomSeverity;
  resolved: boolean;
  tone: SymptomReviewTone;
};

export type SymptomReviewFilters = {
  q: string;
  severity: SymptomSeverity | "ALL";
  status: "ALL" | "OPEN" | "RESOLVED";
};

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function normalize(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function severityTone(severity: SymptomSeverity): SymptomReviewTone {
  if (severity === SymptomSeverity.SEVERE) return "danger";
  if (severity === SymptomSeverity.MODERATE) return "warning";
  return "info";
}

export function getSymptomSeverityTone(severity: SymptomSeverity): SymptomReviewTone {
  return severityTone(severity);
}

function priorityTone(priority: SymptomReviewPriority): SymptomReviewTone {
  if (priority === "critical") return "danger";
  if (priority === "high") return "warning";
  if (priority === "medium") return "info";
  return "neutral";
}

export function getSymptomPriorityTone(priority: SymptomReviewPriority): SymptomReviewTone {
  return priorityTone(priority);
}

function clusterTone(unresolved: number, severe: number): SymptomReviewTone {
  if (severe > 0) return "danger";
  if (unresolved > 1) return "warning";
  if (unresolved > 0) return "info";
  return "success";
}

function matchesSearch(entry: { title: string; bodyArea: string | null; trigger: string | null; notes: string | null }, q: string) {
  const query = normalize(q);
  if (!query) return true;
  return [entry.title, entry.bodyArea, entry.trigger, entry.notes].some((value) => normalize(value).includes(query));
}

export async function getSymptomReviewData(userId: string, filters: SymptomReviewFilters) {
  const thirtyDaysAgo = daysAgo(30);
  const ninetyDaysAgo = daysAgo(90);
  const oneHundredEightyDaysAgo = daysAgo(180);

  const [symptoms, openAlerts, followUpReminders] = await Promise.all([
    db.symptomEntry.findMany({
      where: { userId, startedAt: { gte: oneHundredEightyDaysAgo } },
      orderBy: { startedAt: "desc" },
      take: 160,
    }),
    db.alertEvent.findMany({
      where: {
        userId,
        status: AlertStatus.OPEN,
        OR: [
          { sourceType: AlertSourceType.SYMPTOM_ENTRY },
          { title: { contains: "symptom", mode: "insensitive" } },
          { message: { contains: "symptom", mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.reminder.findMany({
      where: {
        userId,
        state: { in: [ReminderState.DUE, ReminderState.OVERDUE, ReminderState.MISSED] },
        OR: [
          { title: { contains: "symptom", mode: "insensitive" } },
          { description: { contains: "symptom", mode: "insensitive" } },
        ],
      },
      orderBy: { dueAt: "asc" },
      take: 8,
    }),
  ]);

  const recentSymptoms = symptoms.filter((entry) => entry.startedAt >= thirtyDaysAgo);
  const symptoms90 = symptoms.filter((entry) => entry.startedAt >= ninetyDaysAgo);
  const unresolvedSymptoms = symptoms.filter((entry) => !entry.resolved);
  const severeUnresolved = unresolvedSymptoms.filter((entry) => entry.severity === SymptomSeverity.SEVERE);
  const moderateUnresolved = unresolvedSymptoms.filter((entry) => entry.severity === SymptomSeverity.MODERATE);

  const severityBreakdown = {
    mild: symptoms90.filter((entry) => entry.severity === SymptomSeverity.MILD).length,
    moderate: symptoms90.filter((entry) => entry.severity === SymptomSeverity.MODERATE).length,
    severe: symptoms90.filter((entry) => entry.severity === SymptomSeverity.SEVERE).length,
  };

  const bodyAreaMap = new Map<string, typeof symptoms>();
  for (const entry of symptoms90) {
    const label = entry.bodyArea?.trim() || "General / unspecified";
    const key = label.toLowerCase();
    bodyAreaMap.set(key, [...(bodyAreaMap.get(key) ?? []), entry]);
  }

  const clusters: SymptomCluster[] = Array.from(bodyAreaMap.entries())
    .map(([key, entries]) => {
      const unresolved = entries.filter((entry) => !entry.resolved).length;
      const severe = entries.filter((entry) => entry.severity === SymptomSeverity.SEVERE).length;
      const latest = entries.reduce((current, entry) => (entry.startedAt > current.startedAt ? entry : current), entries[0]);
      return {
        key,
        label: entries[0].bodyArea?.trim() || "General / unspecified",
        count: entries.length,
        unresolved,
        severe,
        latestAt: latest.startedAt,
        tone: clusterTone(unresolved, severe),
      };
    })
    .sort((a, b) => b.severe - a.severe || b.unresolved - a.unresolved || b.count - a.count || b.latestAt.getTime() - a.latestAt.getTime())
    .slice(0, 8);

  const actions: SymptomActionItem[] = [];

  for (const entry of severeUnresolved.slice(0, 3)) {
    actions.push({
      id: `severe-${entry.id}`,
      title: `Review severe symptom: ${entry.title}`,
      detail: `${entry.bodyArea || "No body area recorded"} • started ${entry.startedAt.toLocaleDateString("en-PH")}`,
      priority: "critical",
      href: `/symptoms?focus=${entry.id}`,
    });
  }

  if (moderateUnresolved.length > 0) {
    actions.push({
      id: "moderate-unresolved",
      title: "Moderate symptoms still unresolved",
      detail: `${moderateUnresolved.length} moderate symptom${moderateUnresolved.length === 1 ? "" : "s"} may need notes, resolution, or provider follow-up.`,
      priority: "high",
      href: "/symptoms",
    });
  }

  if (openAlerts.length > 0) {
    actions.push({
      id: "symptom-alerts",
      title: "Open symptom alert events",
      detail: `${openAlerts.length} open symptom-related alert${openAlerts.length === 1 ? "" : "s"} should be reviewed from the Alert Center.`,
      priority: "high",
      href: "/alerts",
    });
  }

  if (followUpReminders.length > 0) {
    actions.push({
      id: "symptom-reminders",
      title: "Symptom follow-up reminders are due",
      detail: `${followUpReminders.length} symptom-related reminder${followUpReminders.length === 1 ? "" : "s"} are due, overdue, or missed.`,
      priority: "medium",
      href: "/reminders",
    });
  }

  const symptomsWithoutNotes = symptoms90.filter((entry) => !entry.notes?.trim()).length;
  if (symptomsWithoutNotes > 0) {
    actions.push({
      id: "missing-notes",
      title: "Add notes to symptom entries",
      detail: `${symptomsWithoutNotes} recent symptom entr${symptomsWithoutNotes === 1 ? "y" : "ies"} do not include context notes for triggers, timing, or care actions.`,
      priority: "low",
      href: "/symptoms",
    });
  }

  const filteredSymptoms = symptoms.filter((entry) => {
    if (!matchesSearch(entry, filters.q)) return false;
    if (filters.severity !== "ALL" && entry.severity !== filters.severity) return false;
    if (filters.status === "OPEN" && entry.resolved) return false;
    if (filters.status === "RESOLVED" && !entry.resolved) return false;
    return true;
  });

  const timeline: SymptomTimelineItem[] = filteredSymptoms.slice(0, 40).map((entry) => ({
    id: entry.id,
    title: entry.title,
    detail: [entry.bodyArea, entry.trigger ? `Trigger: ${entry.trigger}` : null, entry.duration ? `Duration: ${entry.duration}` : null]
      .filter(Boolean)
      .join(" • ") || "No additional context recorded",
    at: entry.startedAt,
    severity: entry.severity,
    resolved: entry.resolved,
    tone: entry.resolved ? "success" : severityTone(entry.severity),
  }));

  const documentationCoverage = symptoms90.length > 0 ? Math.round(((symptoms90.length - symptomsWithoutNotes) / symptoms90.length) * 100) : 0;
  const resolutionRate = symptoms90.length > 0 ? Math.round((symptoms90.filter((entry) => entry.resolved).length / symptoms90.length) * 100) : 0;
  const riskLoad = severeUnresolved.length * 25 + moderateUnresolved.length * 10 + openAlerts.length * 15 + followUpReminders.length * 5;
  const readinessScore = Math.max(0, Math.min(100, 100 - riskLoad + Math.round(documentationCoverage * 0.15) + Math.round(resolutionRate * 0.15)));

  return {
    filters,
    summary: {
      readinessScore,
      totalSymptoms: symptoms.length,
      recentSymptoms: recentSymptoms.length,
      unresolvedSymptoms: unresolvedSymptoms.length,
      severeUnresolved: severeUnresolved.length,
      openAlerts: openAlerts.length,
      followUpReminders: followUpReminders.length,
      documentationCoverage,
      resolutionRate,
    },
    severityBreakdown,
    clusters,
    actions: actions.sort((a, b) => {
      const order: Record<SymptomReviewPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    }).slice(0, 8),
    openAlerts,
    followUpReminders,
    timeline,
  };
}
