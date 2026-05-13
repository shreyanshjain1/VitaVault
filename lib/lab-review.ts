import {
  DocumentLinkType,
  DocumentType,
  LabFlag,
  ReminderState,
  ReminderType,
} from "@prisma/client";
import { db } from "@/lib/db";

export type LabReviewPriority = "critical" | "high" | "medium" | "low";
export type LabReviewTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";
export type LabTrendDirection =
  | "new"
  | "improved"
  | "worsening"
  | "stable"
  | "watch";
export type LabInterpretationState =
  | "critical"
  | "worsening"
  | "watch"
  | "improving"
  | "stable"
  | "insufficient-data";

export type LabReviewFilter = {
  q?: string;
  flag?: "ALL" | LabFlag;
};

export type LabReviewAction = {
  id: string;
  title: string;
  detail: string;
  priority: LabReviewPriority;
  href: string;
};

export type LabTrendInput = {
  testName: string;
  resultSummary: string;
  referenceRange?: string | null;
  flag: LabFlag;
  dateTaken: Date;
};

export type LabTrendCard = {
  testName: string;
  latestValue: string;
  latestFlag: LabFlag;
  latestDate: Date;
  previousValue: string | null;
  previousFlag: LabFlag | null;
  direction: LabTrendDirection;
  interpretationState: LabInterpretationState;
  trendLabel: string;
  reviewReason: string;
  followUpGuidance: string;
  count: number;
};

export type LabInterpretationSummary = {
  critical: number;
  worsening: number;
  watch: number;
  improving: number;
  stable: number;
  insufficientData: number;
  reviewQueue: number;
  topState: LabInterpretationState;
  topLabel: string;
  topGuidance: string;
};

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function labFlagTone(flag: LabFlag): LabReviewTone {
  if (flag === LabFlag.HIGH || flag === LabFlag.LOW) return "danger";
  if (flag === LabFlag.BORDERLINE) return "warning";
  return "success";
}

export function getLabFlagTone(flag: LabFlag): LabReviewTone {
  return labFlagTone(flag);
}

function priorityTone(priority: LabReviewPriority): LabReviewTone {
  if (priority === "critical") return "danger";
  if (priority === "high") return "warning";
  if (priority === "medium") return "info";
  return "neutral";
}

export function getLabPriorityTone(priority: LabReviewPriority): LabReviewTone {
  return priorityTone(priority);
}

function scoreLabFlag(flag: LabFlag) {
  if (flag === LabFlag.NORMAL) return 0;
  if (flag === LabFlag.BORDERLINE) return 1;
  return 2;
}

export function getLabTrendDirection(
  latest: LabFlag,
  previous: LabFlag | null,
): LabTrendDirection {
  if (!previous) return "new";

  const latestScore = scoreLabFlag(latest);
  const previousScore = scoreLabFlag(previous);

  if (latestScore < previousScore) return "improved";
  if (latestScore > previousScore) return "worsening";
  if (latest === LabFlag.BORDERLINE) return "watch";
  return "stable";
}

export function getLabTrendLabel(direction: LabTrendDirection) {
  const labels: Record<LabTrendDirection, string> = {
    new: "New baseline",
    improved: "Improving",
    worsening: "Worsening",
    stable: "Stable",
    watch: "Watch trend",
  };
  return labels[direction];
}

export function getLabTrendTone(direction: LabTrendDirection): LabReviewTone {
  if (direction === "improved") return "success";
  if (direction === "worsening") return "danger";
  if (direction === "watch") return "warning";
  if (direction === "stable") return "success";
  return "info";
}

export function getLabInterpretationTone(
  state: LabInterpretationState,
): LabReviewTone {
  if (state === "critical" || state === "worsening") return "danger";
  if (state === "watch") return "warning";
  if (state === "improving" || state === "stable") return "success";
  return "info";
}

export function getLabInterpretationLabel(state: LabInterpretationState) {
  const labels: Record<LabInterpretationState, string> = {
    critical: "Critical review",
    worsening: "Worsening trend",
    watch: "Needs watch",
    improving: "Improving",
    stable: "Stable",
    "insufficient-data": "Needs baseline",
  };
  return labels[state];
}

export function getLabInterpretationState(
  latest: LabFlag,
  previous: LabFlag | null,
): LabInterpretationState {
  const direction = getLabTrendDirection(latest, previous);

  if (
    (latest === LabFlag.HIGH || latest === LabFlag.LOW) &&
    direction === "worsening"
  )
    return "critical";
  if (latest === LabFlag.HIGH || latest === LabFlag.LOW) return "worsening";
  if (latest === LabFlag.BORDERLINE) return "watch";
  if (direction === "improved") return "improving";
  if (direction === "new") return "insufficient-data";
  return "stable";
}

export function getLabReviewReason(latest: LabFlag, previous: LabFlag | null) {
  const direction = getLabTrendDirection(latest, previous);

  if (
    (latest === LabFlag.HIGH || latest === LabFlag.LOW) &&
    direction === "worsening"
  ) {
    return "Latest result is abnormal and worse than the previous value.";
  }

  if (latest === LabFlag.HIGH || latest === LabFlag.LOW) {
    return "Latest result is outside the reference range and should be reviewed.";
  }

  if (latest === LabFlag.BORDERLINE) {
    return previous === LabFlag.BORDERLINE
      ? "Borderline result is repeating and should be monitored."
      : "Latest result is borderline and should stay on the watch list.";
  }

  if (direction === "improved")
    return "Latest result moved toward normal compared with the previous result.";
  if (direction === "new")
    return "Only one result is available, so this is treated as a baseline.";
  return "Latest result is normal and does not show a worsening flag pattern.";
}

export function getLabFollowUpGuidance(
  latest: LabFlag,
  previous: LabFlag | null,
) {
  const state = getLabInterpretationState(latest, previous);

  if (state === "critical")
    return "Prioritize this result for provider review before visit prep or export.";
  if (state === "worsening")
    return "Add this result to the visit packet and confirm whether repeat testing is needed.";
  if (state === "watch")
    return "Keep this result visible in visit prep and compare it with the next lab cycle.";
  if (state === "improving")
    return "Keep the trend available for provider context and continue monitoring.";
  if (state === "stable")
    return "No immediate action required; keep it available in the longitudinal record.";
  return "Add future results to build a usable trend baseline.";
}

export function buildLabTrendCards(
  labs: LabTrendInput[],
  limit = 8,
): LabTrendCard[] {
  const groupedLabs = new Map<string, LabTrendInput[]>();

  for (const lab of labs) {
    const key = lab.testName.trim().toLowerCase();
    const current = groupedLabs.get(key) ?? [];
    current.push(lab);
    groupedLabs.set(key, current);
  }

  return Array.from(groupedLabs.entries())
    .map(([, group]) => {
      const sorted = [...group].sort(
        (a, b) => b.dateTaken.getTime() - a.dateTaken.getTime(),
      );
      const latest = sorted[0];
      const previous = sorted[1] ?? null;
      const direction = getLabTrendDirection(
        latest.flag,
        previous?.flag ?? null,
      );
      const interpretationState = getLabInterpretationState(
        latest.flag,
        previous?.flag ?? null,
      );

      return {
        testName: latest.testName,
        latestValue: latest.resultSummary,
        latestFlag: latest.flag,
        latestDate: latest.dateTaken,
        previousValue: previous?.resultSummary ?? null,
        previousFlag: previous?.flag ?? null,
        direction,
        interpretationState,
        trendLabel: getLabTrendLabel(direction),
        reviewReason: getLabReviewReason(latest.flag, previous?.flag ?? null),
        followUpGuidance: getLabFollowUpGuidance(
          latest.flag,
          previous?.flag ?? null,
        ),
        count: sorted.length,
      } satisfies LabTrendCard;
    })
    .sort((a, b) => {
      const stateWeights: Record<LabInterpretationState, number> = {
        critical: 6,
        worsening: 5,
        watch: 4,
        "insufficient-data": 3,
        improving: 2,
        stable: 1,
      };
      const stateDelta =
        stateWeights[b.interpretationState] -
        stateWeights[a.interpretationState];
      if (stateDelta !== 0) return stateDelta;

      const riskDelta = scoreLabFlag(b.latestFlag) - scoreLabFlag(a.latestFlag);
      if (riskDelta !== 0) return riskDelta;

      return b.latestDate.getTime() - a.latestDate.getTime();
    })
    .slice(0, limit);
}

export function buildLabInterpretationSummary(
  trendCards: LabTrendCard[],
): LabInterpretationSummary {
  const summary: LabInterpretationSummary = {
    critical: 0,
    worsening: 0,
    watch: 0,
    improving: 0,
    stable: 0,
    insufficientData: 0,
    reviewQueue: 0,
    topState: "stable",
    topLabel: "Stable",
    topGuidance: "No immediate lab trend blockers are currently visible.",
  };

  for (const card of trendCards) {
    if (card.interpretationState === "critical") summary.critical += 1;
    if (card.interpretationState === "worsening") summary.worsening += 1;
    if (card.interpretationState === "watch") summary.watch += 1;
    if (card.interpretationState === "improving") summary.improving += 1;
    if (card.interpretationState === "stable") summary.stable += 1;
    if (card.interpretationState === "insufficient-data")
      summary.insufficientData += 1;
  }

  summary.reviewQueue = summary.critical + summary.worsening + summary.watch;

  if (summary.critical > 0) {
    summary.topState = "critical";
    summary.topLabel = "Critical lab review";
    summary.topGuidance =
      "Prioritize abnormal worsening labs before doctor packet export.";
  } else if (summary.worsening > 0) {
    summary.topState = "worsening";
    summary.topLabel = "Worsening labs present";
    summary.topGuidance =
      "Add abnormal results to visit prep and confirm follow-up steps.";
  } else if (summary.watch > 0) {
    summary.topState = "watch";
    summary.topLabel = "Borderline watch list";
    summary.topGuidance =
      "Keep borderline results visible for longitudinal review.";
  } else if (summary.insufficientData > 0) {
    summary.topState = "insufficient-data";
    summary.topLabel = "Baseline building";
    summary.topGuidance =
      "More results are needed before trend interpretation is strong.";
  } else if (summary.improving > 0) {
    summary.topState = "improving";
    summary.topLabel = "Improving trend";
    summary.topGuidance =
      "Keep improving results available as provider context.";
  }

  return summary;
}

export async function getLabReviewData(
  userId: string,
  filters: LabReviewFilter = {},
) {
  const now = new Date();
  const ninetyDaysAgo = daysAgo(90);
  const oneYearAgo = daysAgo(365);

  const [labs, labDocuments, labReminders] = await Promise.all([
    db.labResult.findMany({
      where: { userId },
      orderBy: { dateTaken: "desc" },
      take: 80,
    }),
    db.medicalDocument.findMany({
      where: {
        userId,
        OR: [
          { type: DocumentType.LAB_RESULT },
          { linkedRecordType: DocumentLinkType.LAB_RESULT },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    db.reminder.findMany({
      where: {
        userId,
        type: ReminderType.LAB_FOLLOW_UP,
        state: {
          in: [ReminderState.DUE, ReminderState.OVERDUE, ReminderState.MISSED],
        },
      },
      orderBy: { dueAt: "asc" },
      take: 10,
    }),
  ]);

  const q = normalize(filters.q);
  const flag = filters.flag ?? "ALL";

  const linkedLabIds = new Set(
    labDocuments
      .filter(
        (document) =>
          document.linkedRecordType === DocumentLinkType.LAB_RESULT &&
          document.linkedRecordId,
      )
      .map((document) => document.linkedRecordId as string),
  );

  const filteredLabs = labs.filter((lab) => {
    const matchesFlag = flag === "ALL" || lab.flag === flag;
    const matchesSearch =
      !q ||
      normalize(lab.testName).includes(q) ||
      normalize(lab.resultSummary).includes(q) ||
      normalize(lab.referenceRange).includes(q) ||
      normalize(lab.fileName).includes(q);
    return matchesFlag && matchesSearch;
  });

  const recentLabs = labs.filter((lab) => lab.dateTaken >= ninetyDaysAgo);
  const yearlyLabs = labs.filter((lab) => lab.dateTaken >= oneYearAgo);
  const abnormalLabs = labs.filter(
    (lab) => lab.flag === LabFlag.HIGH || lab.flag === LabFlag.LOW,
  );
  const borderlineLabs = labs.filter((lab) => lab.flag === LabFlag.BORDERLINE);
  const recentAbnormalLabs = recentLabs.filter(
    (lab) => lab.flag === LabFlag.HIGH || lab.flag === LabFlag.LOW,
  );
  const unlinkedLabs = labs.filter((lab) => !linkedLabIds.has(lab.id));
  const unlinkedLabDocuments = labDocuments.filter(
    (document) => !document.linkedRecordId,
  );

  const trendCards = buildLabTrendCards(labs);
  const interpretationSummary = buildLabInterpretationSummary(trendCards);

  const actions: LabReviewAction[] = [];

  for (const card of trendCards
    .filter((card) => card.interpretationState === "critical")
    .slice(0, 3)) {
    actions.push({
      id: `critical-trend-${card.testName}`,
      title: `Prioritize ${card.testName}`,
      detail: `${card.trendLabel}: ${card.reviewReason}`,
      priority: "critical",
      href: `/labs?q=${encodeURIComponent(card.testName)}`,
    });
  }

  for (const lab of recentAbnormalLabs.slice(0, 5)) {
    actions.push({
      id: `abnormal-${lab.id}`,
      title: `Review ${lab.testName}`,
      detail: `${lab.flag} result logged on ${lab.dateTaken.toLocaleDateString("en-PH")}: ${lab.resultSummary}`,
      priority: lab.flag === LabFlag.HIGH ? "high" : "medium",
      href: `/labs?focus=${lab.id}`,
    });
  }

  for (const lab of borderlineLabs.slice(0, 3)) {
    actions.push({
      id: `borderline-${lab.id}`,
      title: `Watch borderline ${lab.testName}`,
      detail: `${lab.resultSummary}${lab.referenceRange ? ` • reference: ${lab.referenceRange}` : ""}`,
      priority: "medium",
      href: `/labs?focus=${lab.id}`,
    });
  }

  if (unlinkedLabs.length > 0) {
    actions.push({
      id: "unlinked-labs",
      title: "Link lab uploads to lab records",
      detail: `${unlinkedLabs.length} lab result${unlinkedLabs.length === 1 ? "" : "s"} do not have a linked document yet.`,
      priority: "low",
      href: "/documents?type=LAB_RESULT",
    });
  }

  if (unlinkedLabDocuments.length > 0) {
    actions.push({
      id: "unlinked-lab-documents",
      title: "Clean up unlinked lab documents",
      detail: `${unlinkedLabDocuments.length} lab document${unlinkedLabDocuments.length === 1 ? "" : "s"} should be connected to a lab record for visit prep.`,
      priority: "low",
      href: "/documents?link=UNLINKED",
    });
  }

  for (const reminder of labReminders.slice(0, 4)) {
    actions.push({
      id: `reminder-${reminder.id}`,
      title:
        reminder.state === ReminderState.OVERDUE || reminder.dueAt < now
          ? "Overdue lab follow-up"
          : "Upcoming lab follow-up",
      detail: `${reminder.title} • due ${reminder.dueAt.toLocaleDateString("en-PH")}`,
      priority:
        reminder.state === ReminderState.OVERDUE || reminder.dueAt < now
          ? "high"
          : "medium",
      href: "/reminders",
    });
  }

  const sortedActions = actions.sort((a, b) => {
    const weights: Record<LabReviewPriority, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return weights[b.priority] - weights[a.priority];
  });

  const flaggedRate =
    labs.length > 0
      ? Math.round(
          ((abnormalLabs.length + borderlineLabs.length) / labs.length) * 100,
        )
      : 0;
  const documentCoverage =
    labs.length > 0
      ? Math.round(((labs.length - unlinkedLabs.length) / labs.length) * 100)
      : 0;
  const recentCoverage =
    yearlyLabs.length > 0
      ? Math.min(100, Math.round((yearlyLabs.length / 6) * 100))
      : 0;
  const readinessScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        documentCoverage * 0.35 +
          (100 - flaggedRate) * 0.35 +
          recentCoverage * 0.3,
      ),
    ),
  );

  const flagBreakdown = {
    normal: labs.filter((lab) => lab.flag === LabFlag.NORMAL).length,
    borderline: borderlineLabs.length,
    high: labs.filter((lab) => lab.flag === LabFlag.HIGH).length,
    low: labs.filter((lab) => lab.flag === LabFlag.LOW).length,
  };

  return {
    summary: {
      totalLabs: labs.length,
      visibleLabs: filteredLabs.length,
      recentLabs: recentLabs.length,
      abnormalLabs: abnormalLabs.length,
      borderlineLabs: borderlineLabs.length,
      linkedLabDocuments: linkedLabIds.size,
      unlinkedLabs: unlinkedLabs.length,
      labReminders: labReminders.length,
      readinessScore,
      documentCoverage,
      flaggedRate,
      trendReviewQueue: interpretationSummary.reviewQueue,
    },
    filters: {
      q: filters.q ?? "",
      flag,
    },
    flagBreakdown,
    interpretationSummary,
    labs: filteredLabs,
    trendCards,
    actions: sortedActions.slice(0, 10),
    labDocuments: labDocuments.slice(0, 8),
    labReminders,
  };
}
