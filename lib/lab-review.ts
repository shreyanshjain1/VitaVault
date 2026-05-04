import { DocumentLinkType, DocumentType, LabFlag, ReminderState, ReminderType } from "@prisma/client";
import { db } from "@/lib/db";

export type LabReviewPriority = "critical" | "high" | "medium" | "low";
export type LabReviewTone = "neutral" | "info" | "success" | "warning" | "danger";

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

export type LabTrendCard = {
  testName: string;
  latestValue: string;
  latestFlag: LabFlag;
  latestDate: Date;
  previousValue: string | null;
  previousFlag: LabFlag | null;
  direction: "new" | "improved" | "worse" | "stable" | "watch";
  count: number;
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

function getTrendDirection(latest: LabFlag, previous: LabFlag | null): LabTrendCard["direction"] {
  if (!previous) return "new";
  const latestScore = scoreLabFlag(latest);
  const previousScore = scoreLabFlag(previous);
  if (latestScore < previousScore) return "improved";
  if (latestScore > previousScore) return "worse";
  if (latest === LabFlag.BORDERLINE) return "watch";
  return "stable";
}

export async function getLabReviewData(userId: string, filters: LabReviewFilter = {}) {
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
        state: { in: [ReminderState.DUE, ReminderState.OVERDUE, ReminderState.MISSED] },
      },
      orderBy: { dueAt: "asc" },
      take: 10,
    }),
  ]);

  const q = normalize(filters.q);
  const flag = filters.flag ?? "ALL";

  const linkedLabIds = new Set(
    labDocuments
      .filter((document) => document.linkedRecordType === DocumentLinkType.LAB_RESULT && document.linkedRecordId)
      .map((document) => document.linkedRecordId as string)
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
  const abnormalLabs = labs.filter((lab) => lab.flag === LabFlag.HIGH || lab.flag === LabFlag.LOW);
  const borderlineLabs = labs.filter((lab) => lab.flag === LabFlag.BORDERLINE);
  const recentAbnormalLabs = recentLabs.filter((lab) => lab.flag === LabFlag.HIGH || lab.flag === LabFlag.LOW);
  const unlinkedLabs = labs.filter((lab) => !linkedLabIds.has(lab.id));
  const unlinkedLabDocuments = labDocuments.filter((document) => !document.linkedRecordId);

  const groupedLabs = new Map<string, typeof labs>();
  for (const lab of labs) {
    const key = lab.testName.trim().toLowerCase();
    const current = groupedLabs.get(key) ?? [];
    current.push(lab);
    groupedLabs.set(key, current);
  }

  const trendCards: LabTrendCard[] = Array.from(groupedLabs.entries())
    .map(([, group]) => {
      const sorted = [...group].sort((a, b) => b.dateTaken.getTime() - a.dateTaken.getTime());
      const latest = sorted[0];
      const previous = sorted[1] ?? null;
      return {
        testName: latest.testName,
        latestValue: latest.resultSummary,
        latestFlag: latest.flag,
        latestDate: latest.dateTaken,
        previousValue: previous?.resultSummary ?? null,
        previousFlag: previous?.flag ?? null,
        direction: getTrendDirection(latest.flag, previous?.flag ?? null),
        count: sorted.length,
      };
    })
    .sort((a, b) => {
      const riskDelta = scoreLabFlag(b.latestFlag) - scoreLabFlag(a.latestFlag);
      if (riskDelta !== 0) return riskDelta;
      return b.latestDate.getTime() - a.latestDate.getTime();
    })
    .slice(0, 8);

  const actions: LabReviewAction[] = [];

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
      title: reminder.state === ReminderState.OVERDUE || reminder.dueAt < now ? "Overdue lab follow-up" : "Upcoming lab follow-up",
      detail: `${reminder.title} • due ${reminder.dueAt.toLocaleDateString("en-PH")}`,
      priority: reminder.state === ReminderState.OVERDUE || reminder.dueAt < now ? "high" : "medium",
      href: "/reminders",
    });
  }

  const sortedActions = actions.sort((a, b) => {
    const weights: Record<LabReviewPriority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return weights[b.priority] - weights[a.priority];
  });

  const flaggedRate = labs.length > 0 ? Math.round(((abnormalLabs.length + borderlineLabs.length) / labs.length) * 100) : 0;
  const documentCoverage = labs.length > 0 ? Math.round(((labs.length - unlinkedLabs.length) / labs.length) * 100) : 0;
  const recentCoverage = yearlyLabs.length > 0 ? Math.min(100, Math.round((yearlyLabs.length / 6) * 100)) : 0;
  const readinessScore = Math.max(0, Math.min(100, Math.round((documentCoverage * 0.35) + ((100 - flaggedRate) * 0.35) + (recentCoverage * 0.3))));

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
    },
    filters: {
      q: filters.q ?? "",
      flag,
    },
    flagBreakdown,
    labs: filteredLabs,
    trendCards,
    actions: sortedActions.slice(0, 10),
    labDocuments: labDocuments.slice(0, 8),
    labReminders,
  };
}
