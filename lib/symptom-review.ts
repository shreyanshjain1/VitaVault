import {
  AlertSourceType,
  AlertStatus,
  ReminderState,
  SymptomSeverity,
} from "@prisma/client";
import { db } from "@/lib/db";

export type SymptomReviewTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";
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

export type SymptomPatternState =
  | "worsening"
  | "recurring"
  | "high-severity"
  | "stale-open"
  | "resolved"
  | "stable";

export type SymptomPatternCard = {
  id: string;
  label: string;
  state: SymptomPatternState;
  stateLabel: string;
  tone: SymptomReviewTone;
  reason: string;
  nextStep: string;
  count: number;
  severe: number;
  unresolved: number;
  latestAt: Date;
  oldestOpenAt: Date | null;
  cadenceLabel: string;
  severityTrail: string;
  dominantTrigger: string | null;
  reviewChecklist: string[];
};

export type SymptomPatternSummary = {
  totalPatterns: number;
  reviewQueue: number;
  actionRequired: number;
  recurring: number;
  worsening: number;
  highSeverity: number;
  staleOpen: number;
  resolved: number;
  stable: number;
};

type SymptomPatternEntry = {
  id: string;
  title: string;
  severity: SymptomSeverity;
  bodyArea: string | null;
  trigger: string | null;
  notes: string | null;
  resolved: boolean;
  startedAt: Date;
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

export function getSymptomSeverityTone(
  severity: SymptomSeverity,
): SymptomReviewTone {
  return severityTone(severity);
}

function priorityTone(priority: SymptomReviewPriority): SymptomReviewTone {
  if (priority === "critical") return "danger";
  if (priority === "high") return "warning";
  if (priority === "medium") return "info";
  return "neutral";
}

export function getSymptomPriorityTone(
  priority: SymptomReviewPriority,
): SymptomReviewTone {
  return priorityTone(priority);
}

const severityWeight: Record<SymptomSeverity, number> = {
  [SymptomSeverity.MILD]: 1,
  [SymptomSeverity.MODERATE]: 2,
  [SymptomSeverity.SEVERE]: 3,
};

const staleOpenDays = 21;

function daysBetween(later: Date, earlier: Date) {
  return Math.floor(
    (later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function patternKey(entry: SymptomPatternEntry) {
  const bodyArea = normalize(entry.bodyArea);
  if (bodyArea) return `area:${bodyArea}`;
  return `symptom:${normalize(entry.title) || "unspecified"}`;
}

function patternLabel(entries: SymptomPatternEntry[]) {
  const bodyArea = entries
    .find((entry) => entry.bodyArea?.trim())
    ?.bodyArea?.trim();
  if (bodyArea) return bodyArea;
  return entries[0]?.title || "Unspecified symptom pattern";
}

export function getSymptomSeverityTrail(entries: SymptomPatternEntry[]) {
  const sorted = [...entries].sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
  );

  if (sorted.length === 0) return "No entries";

  return sorted
    .map((entry) => entry.severity.replace("_", " ").toLowerCase())
    .join(" → ");
}

export function getSymptomCadenceLabel(
  entries: SymptomPatternEntry[],
  now = new Date(),
) {
  if (entries.length === 0) return "No entries yet";
  if (entries.length === 1) {
    const age = daysBetween(now, entries[0].startedAt);
    if (age <= 1) return "Single recent entry";
    return `Single entry from ${age} days ago`;
  }

  const sorted = [...entries].sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
  );
  const first = sorted[0];
  const latest = sorted.at(-1)!;
  const spanDays = Math.max(1, daysBetween(latest.startedAt, first.startedAt));
  const averageGap = Math.max(1, Math.round(spanDays / (sorted.length - 1)));

  if (spanDays <= 7) return `${entries.length} entries in one week`;
  if (averageGap <= 7) return `About every ${averageGap} days`;
  if (averageGap <= 30) return `About every ${averageGap} days`;
  return `${entries.length} entries across ${spanDays} days`;
}

export function getDominantSymptomTrigger(entries: SymptomPatternEntry[]) {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const trigger = entry.trigger?.trim();
    if (!trigger) continue;
    counts.set(trigger, (counts.get(trigger) ?? 0) + 1);
  }

  const [dominant] = Array.from(counts.entries()).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );

  if (!dominant) return null;
  return dominant[1] > 1 ? `${dominant[0]} (${dominant[1]}x)` : dominant[0];
}

export function buildSymptomPatternChecklist(
  entries: SymptomPatternEntry[],
  state: SymptomPatternState,
  now = new Date(),
) {
  const checklist = new Set<string>();
  const unresolved = entries.filter((entry) => !entry.resolved);
  const missingNotes = entries.filter((entry) => !entry.notes?.trim()).length;
  const missingTriggers = entries.filter(
    (entry) => !entry.trigger?.trim(),
  ).length;
  const oldestOpen = unresolved.reduce<Date | null>((oldest, entry) => {
    if (!oldest) return entry.startedAt;
    return entry.startedAt < oldest ? entry.startedAt : oldest;
  }, null);

  if (["worsening", "high-severity"].includes(state)) {
    checklist.add(
      "Flag this pattern for provider review before the next visit.",
    );
  }

  if (state === "recurring") {
    checklist.add(
      "Confirm timing, frequency, and likely trigger across entries.",
    );
  }

  if (oldestOpen && daysBetween(now, oldestOpen) >= staleOpenDays) {
    checklist.add("Refresh or resolve the oldest open symptom entry.");
  }

  if (missingNotes > 0) {
    checklist.add(
      "Add context notes for impact, duration, and self-care actions.",
    );
  }

  if (missingTriggers > 0 && entries.length > 1) {
    checklist.add(
      "Record possible triggers to make the pattern easier to explain.",
    );
  }

  if (state === "resolved") {
    checklist.add(
      "Keep this pattern as historical context in the visit packet.",
    );
  }

  if (checklist.size === 0) {
    checklist.add(
      "Continue monitoring and update the pattern if symptoms change.",
    );
  }

  return Array.from(checklist).slice(0, 3);
}

export function getSymptomPatternTone(
  state: SymptomPatternState,
): SymptomReviewTone {
  if (state === "worsening" || state === "high-severity") return "danger";
  if (state === "recurring" || state === "stale-open") return "warning";
  if (state === "resolved") return "success";
  return "info";
}

export function getSymptomPatternLabel(state: SymptomPatternState) {
  const labels: Record<SymptomPatternState, string> = {
    worsening: "Worsening pattern",
    recurring: "Recurring pattern",
    "high-severity": "High severity",
    "stale-open": "Stale open",
    resolved: "Resolved pattern",
    stable: "Stable pattern",
  };
  return labels[state];
}

export function getSymptomPatternNextStep(state: SymptomPatternState) {
  const steps: Record<SymptomPatternState, string> = {
    worsening:
      "Escalate this pattern during the next visit and add recent triggers, timing, and impact notes.",
    recurring:
      "Group these recurring entries into the visit packet and confirm whether there is a common trigger.",
    "high-severity":
      "Review the severe entry first and confirm whether urgent care guidance or alert follow-up is needed.",
    "stale-open":
      "Close out the open symptom if resolved, or add a fresh update before sharing the record.",
    resolved:
      "Keep this as context for the care timeline; no immediate follow-up is required.",
    stable:
      "Continue monitoring and add notes if frequency, severity, or triggers change.",
  };
  return steps[state];
}

export function getSymptomPatternReason(
  entries: SymptomPatternEntry[],
  state: SymptomPatternState,
  now = new Date(),
) {
  const unresolved = entries.filter((entry) => !entry.resolved);
  const severe = entries.filter(
    (entry) => entry.severity === SymptomSeverity.SEVERE,
  );
  const sorted = [...entries].sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
  );
  const latest = sorted.at(-1);
  const oldestOpen = unresolved.reduce<Date | null>((oldest, entry) => {
    if (!oldest) return entry.startedAt;
    return entry.startedAt < oldest ? entry.startedAt : oldest;
  }, null);

  if (state === "worsening" && latest) {
    return `Latest entry is ${latest.severity.toLowerCase()} after lower-severity history in this pattern.`;
  }

  if (state === "high-severity") {
    return `${severe.length} severe entr${severe.length === 1 ? "y" : "ies"} found in this symptom pattern.`;
  }

  if (state === "recurring") {
    return `${entries.length} entries in this pattern within the recent review window.`;
  }

  if (state === "stale-open" && oldestOpen) {
    return `Open for ${daysBetween(now, oldestOpen)} days without a resolution marker.`;
  }

  if (state === "resolved") {
    return "All entries in this pattern are currently marked resolved.";
  }

  return "Pattern is documented and does not show immediate escalation signals.";
}

export function getSymptomPatternState(
  entries: SymptomPatternEntry[],
  now = new Date(),
): SymptomPatternState {
  if (entries.length === 0) return "stable";

  const sorted = [...entries].sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
  );
  const latest = sorted.at(-1)!;
  const earliest = sorted[0];
  const unresolved = entries.filter((entry) => !entry.resolved);
  const oldestOpen = unresolved.reduce<Date | null>((oldest, entry) => {
    if (!oldest) return entry.startedAt;
    return entry.startedAt < oldest ? entry.startedAt : oldest;
  }, null);
  const hasSevereUnresolved = unresolved.some(
    (entry) => entry.severity === SymptomSeverity.SEVERE,
  );
  const worsenedFromBaseline =
    severityWeight[latest.severity] > severityWeight[earliest.severity] &&
    !latest.resolved;

  if (worsenedFromBaseline) return "worsening";
  if (hasSevereUnresolved) return "high-severity";
  if (entries.length >= 3 && unresolved.length > 0) return "recurring";
  if (oldestOpen && daysBetween(now, oldestOpen) >= staleOpenDays)
    return "stale-open";
  if (entries.every((entry) => entry.resolved)) return "resolved";
  return "stable";
}

export function buildSymptomPatternCards(
  entries: SymptomPatternEntry[],
  now = new Date(),
): SymptomPatternCard[] {
  const groups = new Map<string, SymptomPatternEntry[]>();

  for (const entry of entries) {
    const key = patternKey(entry);
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }

  return Array.from(groups.entries())
    .map(([key, patternEntries]) => {
      const state = getSymptomPatternState(patternEntries, now);
      const sorted = [...patternEntries].sort(
        (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
      );
      const unresolved = patternEntries.filter((entry) => !entry.resolved);
      const oldestOpenAt = unresolved.reduce<Date | null>((oldest, entry) => {
        if (!oldest) return entry.startedAt;
        return entry.startedAt < oldest ? entry.startedAt : oldest;
      }, null);

      return {
        id: key,
        label: patternLabel(patternEntries),
        state,
        stateLabel: getSymptomPatternLabel(state),
        tone: getSymptomPatternTone(state),
        reason: getSymptomPatternReason(patternEntries, state, now),
        nextStep: getSymptomPatternNextStep(state),
        count: patternEntries.length,
        severe: patternEntries.filter(
          (entry) => entry.severity === SymptomSeverity.SEVERE,
        ).length,
        unresolved: unresolved.length,
        latestAt: sorted[0].startedAt,
        oldestOpenAt,
        cadenceLabel: getSymptomCadenceLabel(patternEntries, now),
        severityTrail: getSymptomSeverityTrail(patternEntries),
        dominantTrigger: getDominantSymptomTrigger(patternEntries),
        reviewChecklist: buildSymptomPatternChecklist(
          patternEntries,
          state,
          now,
        ),
      } satisfies SymptomPatternCard;
    })
    .sort((a, b) => {
      const order: Record<SymptomPatternState, number> = {
        worsening: 0,
        "high-severity": 1,
        recurring: 2,
        "stale-open": 3,
        stable: 4,
        resolved: 5,
      };
      return (
        order[a.state] - order[b.state] ||
        b.unresolved - a.unresolved ||
        b.severe - a.severe ||
        b.latestAt.getTime() - a.latestAt.getTime()
      );
    });
}

export function buildSymptomPatternSummary(
  cards: SymptomPatternCard[],
): SymptomPatternSummary {
  const actionStates: SymptomPatternState[] = [
    "worsening",
    "high-severity",
    "recurring",
    "stale-open",
  ];

  return {
    totalPatterns: cards.length,
    reviewQueue: cards.filter((card) => actionStates.includes(card.state))
      .length,
    actionRequired: cards.filter((card) =>
      ["worsening", "high-severity", "stale-open"].includes(card.state),
    ).length,
    recurring: cards.filter((card) => card.state === "recurring").length,
    worsening: cards.filter((card) => card.state === "worsening").length,
    highSeverity: cards.filter((card) => card.state === "high-severity").length,
    staleOpen: cards.filter((card) => card.state === "stale-open").length,
    resolved: cards.filter((card) => card.state === "resolved").length,
    stable: cards.filter((card) => card.state === "stable").length,
  };
}

function clusterTone(unresolved: number, severe: number): SymptomReviewTone {
  if (severe > 0) return "danger";
  if (unresolved > 1) return "warning";
  if (unresolved > 0) return "info";
  return "success";
}

function matchesSearch(
  entry: {
    title: string;
    bodyArea: string | null;
    trigger: string | null;
    notes: string | null;
  },
  q: string,
) {
  const query = normalize(q);
  if (!query) return true;
  return [entry.title, entry.bodyArea, entry.trigger, entry.notes].some(
    (value) => normalize(value).includes(query),
  );
}

export async function getSymptomReviewData(
  userId: string,
  filters: SymptomReviewFilters,
) {
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
        state: {
          in: [ReminderState.DUE, ReminderState.OVERDUE, ReminderState.MISSED],
        },
        OR: [
          { title: { contains: "symptom", mode: "insensitive" } },
          { description: { contains: "symptom", mode: "insensitive" } },
        ],
      },
      orderBy: { dueAt: "asc" },
      take: 8,
    }),
  ]);

  const recentSymptoms = symptoms.filter(
    (entry) => entry.startedAt >= thirtyDaysAgo,
  );
  const symptoms90 = symptoms.filter(
    (entry) => entry.startedAt >= ninetyDaysAgo,
  );
  const unresolvedSymptoms = symptoms.filter((entry) => !entry.resolved);
  const severeUnresolved = unresolvedSymptoms.filter(
    (entry) => entry.severity === SymptomSeverity.SEVERE,
  );
  const moderateUnresolved = unresolvedSymptoms.filter(
    (entry) => entry.severity === SymptomSeverity.MODERATE,
  );

  const severityBreakdown = {
    mild: symptoms90.filter((entry) => entry.severity === SymptomSeverity.MILD)
      .length,
    moderate: symptoms90.filter(
      (entry) => entry.severity === SymptomSeverity.MODERATE,
    ).length,
    severe: symptoms90.filter(
      (entry) => entry.severity === SymptomSeverity.SEVERE,
    ).length,
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
      const severe = entries.filter(
        (entry) => entry.severity === SymptomSeverity.SEVERE,
      ).length;
      const latest = entries.reduce(
        (current, entry) =>
          entry.startedAt > current.startedAt ? entry : current,
        entries[0],
      );
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
    .sort(
      (a, b) =>
        b.severe - a.severe ||
        b.unresolved - a.unresolved ||
        b.count - a.count ||
        b.latestAt.getTime() - a.latestAt.getTime(),
    )
    .slice(0, 8);

  const patternCards = buildSymptomPatternCards(symptoms90);
  const patternSummary = buildSymptomPatternSummary(patternCards);

  const actions: SymptomActionItem[] = [];

  const worseningPatterns = patternCards.filter(
    (card) => card.state === "worsening",
  );
  if (worseningPatterns.length > 0) {
    actions.push({
      id: "worsening-patterns",
      title: "Worsening symptom pattern detected",
      detail: `${worseningPatterns.length} pattern${worseningPatterns.length === 1 ? "" : "s"} show a more severe latest entry than the first recent entry.`,
      priority: "critical",
      href: "/symptom-review",
    });
  }

  const recurringPatterns = patternCards.filter(
    (card) => card.state === "recurring",
  );
  if (recurringPatterns.length > 0) {
    actions.push({
      id: "recurring-patterns",
      title: "Recurring symptom pattern needs review",
      detail: `${recurringPatterns.length} recurring pattern${recurringPatterns.length === 1 ? "" : "s"} may need trigger notes or provider follow-up.`,
      priority: "high",
      href: "/symptom-review",
    });
  }

  const staleOpenPatterns = patternCards.filter(
    (card) => card.state === "stale-open",
  );
  if (staleOpenPatterns.length > 0) {
    actions.push({
      id: "stale-open-patterns",
      title: "Stale open symptom pattern",
      detail: `${staleOpenPatterns.length} open pattern${staleOpenPatterns.length === 1 ? "" : "s"} have not been resolved or refreshed in ${staleOpenDays}+ days.`,
      priority: "medium",
      href: "/symptoms",
    });
  }

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

  const symptomsWithoutNotes = symptoms90.filter(
    (entry) => !entry.notes?.trim(),
  ).length;
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
    if (filters.severity !== "ALL" && entry.severity !== filters.severity)
      return false;
    if (filters.status === "OPEN" && entry.resolved) return false;
    if (filters.status === "RESOLVED" && !entry.resolved) return false;
    return true;
  });

  const timeline: SymptomTimelineItem[] = filteredSymptoms
    .slice(0, 40)
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      detail:
        [
          entry.bodyArea,
          entry.trigger ? `Trigger: ${entry.trigger}` : null,
          entry.duration ? `Duration: ${entry.duration}` : null,
        ]
          .filter(Boolean)
          .join(" • ") || "No additional context recorded",
      at: entry.startedAt,
      severity: entry.severity,
      resolved: entry.resolved,
      tone: entry.resolved ? "success" : severityTone(entry.severity),
    }));

  const documentationCoverage =
    symptoms90.length > 0
      ? Math.round(
          ((symptoms90.length - symptomsWithoutNotes) / symptoms90.length) *
            100,
        )
      : 0;
  const resolutionRate =
    symptoms90.length > 0
      ? Math.round(
          (symptoms90.filter((entry) => entry.resolved).length /
            symptoms90.length) *
            100,
        )
      : 0;
  const riskLoad =
    severeUnresolved.length * 25 +
    moderateUnresolved.length * 10 +
    openAlerts.length * 15 +
    followUpReminders.length * 5 +
    patternSummary.reviewQueue * 6;
  const readinessScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        riskLoad +
        Math.round(documentationCoverage * 0.15) +
        Math.round(resolutionRate * 0.15),
    ),
  );

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
    patternSummary,
    patternCards: patternCards.slice(0, 8),
    clusters,
    actions: actions
      .sort((a, b) => {
        const order: Record<SymptomReviewPriority, number> = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        return order[a.priority] - order[b.priority];
      })
      .slice(0, 8),
    openAlerts,
    followUpReminders,
    timeline,
  };
}
