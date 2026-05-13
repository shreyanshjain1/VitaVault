import {
  AlertRuleCategory,
  AlertSeverity,
  AlertSourceType,
  AlertStatus,
  MedicationLogStatus,
  MedicationStatus,
  ReminderState,
  ReminderType,
} from "@prisma/client";
import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  startOfDay,
  subDays,
} from "date-fns";
import { db } from "@/lib/db";

export type MedicationSafetyTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export type MedicationReviewState =
  | "critical"
  | "needs-review"
  | "monitor"
  | "stable"
  | "insufficient-data";

export type MedicationSafetyItem = {
  id: string;
  title: string;
  description: string;
  tone: MedicationSafetyTone;
  priority: "Critical" | "High" | "Medium" | "Low";
  action: string;
};

export type MedicationDoseRow = {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduleTime: string;
  doctorName: string;
  status: "TAKEN" | "MISSED" | "SKIPPED" | "UNLOGGED";
  loggedAt: Date | null;
  tone: MedicationSafetyTone;
};

export type MedicationAdherenceSignal = {
  state: MedicationReviewState;
  label: string;
  tone: MedicationSafetyTone;
  reason: string;
  action: string;
};

export type MedicationAdherenceSignalInput = {
  adherence: number;
  logged: number;
  missed: number;
  skipped: number;
  scheduleCount: number;
  daysUntilEnd: number | null;
  hasDoctor: boolean;
};

export type MedicationReviewSummary = {
  critical: number;
  needsReview: number;
  monitor: number;
  stable: number;
  insufficientData: number;
  reviewQueue: number;
  label: string;
  tone: MedicationSafetyTone;
  nextStep: string;
};

export type MedicationSafetyData = Awaited<
  ReturnType<typeof getMedicationSafetyData>
>;

type LogLite = {
  medicationId: string;
  scheduleTime: string | null;
  loggedAt: Date;
  status: MedicationLogStatus;
};

type MedicationReviewCard = {
  reviewSignal: MedicationAdherenceSignal;
};

function doseKey(medicationId: string, scheduleTime: string | null) {
  return `${medicationId}__${scheduleTime ?? "unscheduled"}`;
}

function adherenceTone(value: number): MedicationSafetyTone {
  if (value >= 85) return "success";
  if (value >= 65) return "warning";
  return "danger";
}

function statusTone(status: MedicationDoseRow["status"]): MedicationSafetyTone {
  if (status === "TAKEN") return "success";
  if (status === "MISSED") return "danger";
  if (status === "SKIPPED") return "warning";
  return "neutral";
}

function buildLatestLogMap(logs: LogLite[]) {
  const map = new Map<string, LogLite>();
  for (const log of logs) {
    const key = doseKey(log.medicationId, log.scheduleTime);
    const existing = map.get(key);
    if (!existing || existing.loggedAt < log.loggedAt) {
      map.set(key, log);
    }
  }
  return map;
}

export function getMedicationReviewStateLabel(state: MedicationReviewState) {
  if (state === "critical") return "Critical review";
  if (state === "needs-review") return "Needs review";
  if (state === "monitor") return "Monitor";
  if (state === "stable") return "Stable";
  return "Insufficient data";
}

export function getMedicationReviewStateTone(
  state: MedicationReviewState,
): MedicationSafetyTone {
  if (state === "critical") return "danger";
  if (state === "needs-review") return "warning";
  if (state === "monitor") return "info";
  if (state === "stable") return "success";
  return "neutral";
}

export function getMedicationAdherenceSignal(
  input: MedicationAdherenceSignalInput,
): MedicationAdherenceSignal {
  const missedOrSkipped = input.missed + input.skipped;
  const isExpiredActive = input.daysUntilEnd !== null && input.daysUntilEnd < 0;
  const endsSoon =
    input.daysUntilEnd !== null &&
    input.daysUntilEnd >= 0 &&
    input.daysUntilEnd <= 14;

  if (isExpiredActive) {
    return {
      state: "critical",
      label: getMedicationReviewStateLabel("critical"),
      tone: getMedicationReviewStateTone("critical"),
      reason: "The medication is still active after its documented end date.",
      action:
        "Confirm whether this medication should be completed, renewed, or corrected before sharing records.",
    };
  }

  if (input.scheduleCount === 0) {
    return {
      state: "needs-review",
      label: getMedicationReviewStateLabel("needs-review"),
      tone: getMedicationReviewStateTone("needs-review"),
      reason: "No dose schedule is configured for adherence tracking.",
      action:
        "Add schedule times or mark the medication workflow as as-needed before relying on adherence reports.",
    };
  }

  if (input.logged === 0) {
    return {
      state: "insufficient-data",
      label: getMedicationReviewStateLabel("insufficient-data"),
      tone: getMedicationReviewStateTone("insufficient-data"),
      reason: "No dose logs are available for the 30-day review window.",
      action:
        "Start logging taken, missed, or skipped doses to build a reliable adherence signal.",
    };
  }

  if (input.adherence < 65 || missedOrSkipped >= 3) {
    return {
      state: "needs-review",
      label: getMedicationReviewStateLabel("needs-review"),
      tone: getMedicationReviewStateTone("needs-review"),
      reason: `${missedOrSkipped} missed or skipped dose(s) and ${input.adherence}% adherence in the review window.`,
      action:
        "Review dose timing, reminders, side effects, and provider follow-up before the next visit or export.",
    };
  }

  if (input.adherence < 85 || endsSoon || !input.hasDoctor) {
    const reason = !input.hasDoctor
      ? "No prescribing provider is linked to this medication."
      : endsSoon
        ? "The medication is ending soon and may need refill or renewal planning."
        : `${input.adherence}% adherence is below the preferred review target.`;

    return {
      state: "monitor",
      label: getMedicationReviewStateLabel("monitor"),
      tone: getMedicationReviewStateTone("monitor"),
      reason,
      action:
        "Keep this medication on the review list and confirm context during visit prep.",
    };
  }

  return {
    state: "stable",
    label: getMedicationReviewStateLabel("stable"),
    tone: getMedicationReviewStateTone("stable"),
    reason: `${input.adherence}% adherence with schedule and provider context available.`,
    action:
      "No immediate medication safety action is needed. Continue routine logging.",
  };
}

export function buildMedicationReviewSummary(
  cards: MedicationReviewCard[],
): MedicationReviewSummary {
  const summary = cards.reduce(
    (acc, card) => {
      if (card.reviewSignal.state === "critical") acc.critical += 1;
      if (card.reviewSignal.state === "needs-review") acc.needsReview += 1;
      if (card.reviewSignal.state === "monitor") acc.monitor += 1;
      if (card.reviewSignal.state === "stable") acc.stable += 1;
      if (card.reviewSignal.state === "insufficient-data")
        acc.insufficientData += 1;
      return acc;
    },
    {
      critical: 0,
      needsReview: 0,
      monitor: 0,
      stable: 0,
      insufficientData: 0,
    },
  );

  const reviewQueue =
    summary.critical +
    summary.needsReview +
    summary.monitor +
    summary.insufficientData;

  if (summary.critical > 0) {
    return {
      ...summary,
      reviewQueue,
      label: "Critical medication review",
      tone: "danger",
      nextStep:
        "Start with expired active medications or high-risk adherence gaps before exporting or sharing records.",
    };
  }

  if (summary.needsReview > 0) {
    return {
      ...summary,
      reviewQueue,
      label: "Medication review needed",
      tone: "warning",
      nextStep:
        "Review missed doses, missing schedules, or low adherence before the next provider visit.",
    };
  }

  if (summary.monitor > 0 || summary.insufficientData > 0) {
    return {
      ...summary,
      reviewQueue,
      label: "Monitor medication records",
      tone: "info",
      nextStep:
        "Confirm provider links, ending medications, and dose logs so the medication packet stays reliable.",
    };
  }

  return {
    ...summary,
    reviewQueue,
    label:
      cards.length > 0
        ? "Medication profile stable"
        : "No active medication profile",
    tone: cards.length > 0 ? "success" : "neutral",
    nextStep:
      cards.length > 0
        ? "Medication records look ready for routine visit prep and exports."
        : "Add active medications to begin safety review.",
  };
}

export async function getMedicationSafetyData(userId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const thirtyDaysAgo = startOfDay(subDays(now, 29));
  const nextThirtyDays = endOfDay(addDays(now, 30));

  const [
    medications,
    logs30Days,
    todayLogs,
    openMedicationAlerts,
    medicationReminders,
  ] = await Promise.all([
    db.medication.findMany({
      where: { userId },
      include: {
        schedules: { orderBy: { timeOfDay: "asc" } },
        doctor: { select: { id: true, name: true, specialty: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    db.medicationLog.findMany({
      where: { userId, loggedAt: { gte: thirtyDaysAgo } },
      orderBy: { loggedAt: "desc" },
      select: {
        medicationId: true,
        scheduleTime: true,
        loggedAt: true,
        status: true,
      },
    }),
    db.medicationLog.findMany({
      where: { userId, loggedAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { loggedAt: "desc" },
      select: {
        medicationId: true,
        scheduleTime: true,
        loggedAt: true,
        status: true,
      },
    }),
    db.alertEvent.findMany({
      where: {
        userId,
        status: AlertStatus.OPEN,
        OR: [
          { category: AlertRuleCategory.MEDICATION_ADHERENCE },
          { sourceType: AlertSourceType.MEDICATION_LOG },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        message: true,
        severity: true,
        createdAt: true,
      },
    }),
    db.reminder.findMany({
      where: {
        userId,
        type: ReminderType.MEDICATION,
        dueAt: { lte: nextThirtyDays },
        state: {
          in: [ReminderState.DUE, ReminderState.OVERDUE, ReminderState.MISSED],
        },
      },
      orderBy: { dueAt: "asc" },
      take: 12,
      select: {
        id: true,
        title: true,
        description: true,
        dueAt: true,
        state: true,
      },
    }),
  ]);

  const activeMedications = medications.filter(
    (item) => item.active && item.status === MedicationStatus.ACTIVE,
  );

  const scheduledDoseSlots = activeMedications.reduce(
    (sum, medication) => sum + Math.max(1, medication.schedules.length),
    0,
  );

  const thirtyDayTaken = logs30Days.filter(
    (log) => log.status === MedicationLogStatus.TAKEN,
  ).length;
  const thirtyDayMissed = logs30Days.filter(
    (log) => log.status === MedicationLogStatus.MISSED,
  ).length;
  const thirtyDaySkipped = logs30Days.filter(
    (log) => log.status === MedicationLogStatus.SKIPPED,
  ).length;
  const thirtyDayLogged = thirtyDayTaken + thirtyDayMissed + thirtyDaySkipped;
  const adherenceRate =
    thirtyDayLogged > 0
      ? Math.round((thirtyDayTaken / thirtyDayLogged) * 100)
      : 0;
  const missedRate =
    thirtyDayLogged > 0
      ? Math.round(
          ((thirtyDayMissed + thirtyDaySkipped) / thirtyDayLogged) * 100,
        )
      : 0;

  const todayLogMap = buildLatestLogMap(todayLogs);
  const todayDoseRows: MedicationDoseRow[] = activeMedications.flatMap(
    (medication) => {
      const scheduleTimes = medication.schedules.length
        ? medication.schedules.map((schedule) => schedule.timeOfDay)
        : ["Unscheduled"];

      return scheduleTimes.map((scheduleTime) => {
        const normalizedSchedule =
          scheduleTime === "Unscheduled" ? null : scheduleTime;
        const log = todayLogMap.get(doseKey(medication.id, normalizedSchedule));
        const status = log?.status ?? "UNLOGGED";

        return {
          id: `${medication.id}-${scheduleTime}`,
          medicationId: medication.id,
          medicationName: medication.name,
          dosage: medication.dosage,
          scheduleTime,
          doctorName: medication.doctor?.name ?? "No linked doctor",
          status,
          loggedAt: log?.loggedAt ?? null,
          tone: statusTone(status),
        };
      });
    },
  );

  const todayTaken = todayDoseRows.filter(
    (row) => row.status === "TAKEN",
  ).length;
  const todayMissedOrSkipped = todayDoseRows.filter(
    (row) => row.status === "MISSED" || row.status === "SKIPPED",
  ).length;
  const todayUnlogged = todayDoseRows.filter(
    (row) => row.status === "UNLOGGED",
  ).length;
  const todayCompletionRate =
    todayDoseRows.length > 0
      ? Math.round((todayTaken / todayDoseRows.length) * 100)
      : 0;

  const medsWithoutSchedules = activeMedications.filter(
    (medication) => medication.schedules.length === 0,
  );
  const medsWithoutDoctor = activeMedications.filter(
    (medication) => !medication.doctorId,
  );
  const endingSoon = activeMedications
    .filter(
      (medication) =>
        medication.endDate &&
        medication.endDate >= now &&
        medication.endDate <= nextThirtyDays,
    )
    .sort((a, b) => Number(a.endDate) - Number(b.endDate));
  const expiredButActive = activeMedications.filter(
    (medication) => medication.endDate && medication.endDate < now,
  );

  const highSeverityMedicationAlerts = openMedicationAlerts.filter(
    (alert) =>
      alert.severity === AlertSeverity.HIGH ||
      alert.severity === AlertSeverity.CRITICAL,
  );

  const safetyItems: MedicationSafetyItem[] = [
    ...highSeverityMedicationAlerts.map((alert) => ({
      id: `alert-${alert.id}`,
      title: alert.title,
      description: alert.message,
      tone: "danger" as const,
      priority:
        alert.severity === AlertSeverity.CRITICAL
          ? ("Critical" as const)
          : ("High" as const),
      action:
        "Review the adherence alert and resolve or acknowledge it from the Alert Center.",
    })),
    ...expiredButActive.map((medication) => ({
      id: `expired-${medication.id}`,
      title: `${medication.name} is still active after its end date`,
      description: `This medication ended on ${medication.endDate?.toLocaleDateString("en-PH") ?? "a past date"} but is still marked active.`,
      tone: "danger" as const,
      priority: "High" as const,
      action:
        "Confirm whether the medication should be completed, renewed, or updated.",
    })),
    ...medsWithoutSchedules.map((medication) => ({
      id: `schedule-${medication.id}`,
      title: `${medication.name} has no dose schedule`,
      description:
        "A medication without schedule times is harder to track for adherence.",
      tone: "warning" as const,
      priority: "Medium" as const,
      action:
        "Add at least one schedule time or clarify that this is an as-needed medication.",
    })),
    ...endingSoon.slice(0, 5).map((medication) => ({
      id: `ending-${medication.id}`,
      title: `${medication.name} ends soon`,
      description: `Current end date is ${medication.endDate?.toLocaleDateString("en-PH")}.`,
      tone: "info" as const,
      priority: "Low" as const,
      action:
        "Prepare a refill, renewal, or doctor follow-up if this medication should continue.",
    })),
    ...medsWithoutDoctor.slice(0, 5).map((medication) => ({
      id: `doctor-${medication.id}`,
      title: `${medication.name} has no linked doctor`,
      description:
        "Linking a prescribing doctor improves handoff reports and care-team review.",
      tone: "neutral" as const,
      priority: "Low" as const,
      action:
        "Attach a doctor/provider to the medication record when available.",
    })),
  ];

  const readinessChecks = [
    {
      label: "Active medications documented",
      complete: activeMedications.length > 0,
      detail:
        activeMedications.length > 0
          ? `${activeMedications.length} active medication(s)`
          : "No active medications yet",
    },
    {
      label: "Dose schedules configured",
      complete:
        activeMedications.length > 0 && medsWithoutSchedules.length === 0,
      detail:
        medsWithoutSchedules.length === 0
          ? "Every active medication has a schedule"
          : `${medsWithoutSchedules.length} medication(s) need schedule times`,
    },
    {
      label: "Today has adherence activity",
      complete:
        todayTaken + todayMissedOrSkipped > 0 || todayDoseRows.length === 0,
      detail:
        todayDoseRows.length === 0
          ? "No scheduled dose rows today"
          : `${todayTaken + todayMissedOrSkipped} logged dose(s) today`,
    },
    {
      label: "No high-risk medication alerts",
      complete: highSeverityMedicationAlerts.length === 0,
      detail:
        highSeverityMedicationAlerts.length === 0
          ? "No high-risk medication alerts open"
          : `${highSeverityMedicationAlerts.length} high-risk alert(s) open`,
    },
    {
      label: "No active expired medications",
      complete: expiredButActive.length === 0,
      detail:
        expiredButActive.length === 0
          ? "No expired active medications"
          : `${expiredButActive.length} medication(s) need review`,
    },
  ];

  const readinessScore = Math.round(
    (readinessChecks.filter((check) => check.complete).length /
      readinessChecks.length) *
      100,
  );

  const medicationCards = activeMedications.map((medication) => {
    const medLogs = logs30Days.filter(
      (log) => log.medicationId === medication.id,
    );
    const taken = medLogs.filter(
      (log) => log.status === MedicationLogStatus.TAKEN,
    ).length;
    const missed = medLogs.filter(
      (log) => log.status === MedicationLogStatus.MISSED,
    ).length;
    const skipped = medLogs.filter(
      (log) => log.status === MedicationLogStatus.SKIPPED,
    ).length;
    const logged = taken + missed + skipped;
    const adherence = logged > 0 ? Math.round((taken / logged) * 100) : 0;
    const daysUntilEnd = medication.endDate
      ? differenceInCalendarDays(medication.endDate, now)
      : null;
    const reviewSignal = getMedicationAdherenceSignal({
      adherence,
      logged,
      missed,
      skipped,
      scheduleCount: medication.schedules.length,
      daysUntilEnd,
      hasDoctor: Boolean(medication.doctorId),
    });

    return {
      id: medication.id,
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      instructions: medication.instructions,
      scheduleCount: medication.schedules.length,
      doctorName: medication.doctor?.name ?? null,
      endDate: medication.endDate,
      daysUntilEnd,
      adherence,
      logged,
      taken,
      missed,
      skipped,
      tone: logged === 0 ? ("neutral" as const) : adherenceTone(adherence),
      reviewSignal,
    };
  });

  const reviewSummary = buildMedicationReviewSummary(medicationCards);

  return {
    generatedAt: now,
    summary: {
      activeMedications: activeMedications.length,
      scheduledDoseSlots,
      todayCompletionRate,
      todayTaken,
      todayMissedOrSkipped,
      todayUnlogged,
      adherenceRate,
      missedRate,
      openMedicationAlerts: openMedicationAlerts.length,
      highSeverityMedicationAlerts: highSeverityMedicationAlerts.length,
      medicationReminders: medicationReminders.length,
      readinessScore,
      medicationReviewQueue: reviewSummary.reviewQueue,
      criticalMedicationReviews: reviewSummary.critical,
    },
    reviewSummary,
    readinessChecks,
    safetyItems: safetyItems.slice(0, 12),
    todayDoseRows,
    medicationCards,
    medicationReminders,
    openMedicationAlerts,
  };
}
