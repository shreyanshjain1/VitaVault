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
import { addDays, differenceInCalendarDays, endOfDay, startOfDay, subDays } from "date-fns";
import { db } from "@/lib/db";

export type MedicationSafetyTone = "success" | "warning" | "danger" | "info" | "neutral";

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

export type MedicationSafetyData = Awaited<ReturnType<typeof getMedicationSafetyData>>;

type LogLite = {
  medicationId: string;
  scheduleTime: string | null;
  loggedAt: Date;
  status: MedicationLogStatus;
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

export async function getMedicationSafetyData(userId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const thirtyDaysAgo = startOfDay(subDays(now, 29));
  const nextThirtyDays = endOfDay(addDays(now, 30));

  const [medications, logs30Days, todayLogs, openMedicationAlerts, medicationReminders] = await Promise.all([
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
        state: { in: [ReminderState.DUE, ReminderState.OVERDUE, ReminderState.MISSED] },
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
    (item) => item.active && item.status === MedicationStatus.ACTIVE
  );

  const scheduledDoseSlots = activeMedications.reduce(
    (sum, medication) => sum + Math.max(1, medication.schedules.length),
    0
  );

  const thirtyDayTaken = logs30Days.filter((log) => log.status === MedicationLogStatus.TAKEN).length;
  const thirtyDayMissed = logs30Days.filter((log) => log.status === MedicationLogStatus.MISSED).length;
  const thirtyDaySkipped = logs30Days.filter((log) => log.status === MedicationLogStatus.SKIPPED).length;
  const thirtyDayLogged = thirtyDayTaken + thirtyDayMissed + thirtyDaySkipped;
  const adherenceRate = thirtyDayLogged > 0 ? Math.round((thirtyDayTaken / thirtyDayLogged) * 100) : 0;
  const missedRate = thirtyDayLogged > 0 ? Math.round(((thirtyDayMissed + thirtyDaySkipped) / thirtyDayLogged) * 100) : 0;

  const todayLogMap = buildLatestLogMap(todayLogs);
  const todayDoseRows: MedicationDoseRow[] = activeMedications.flatMap((medication) => {
    const scheduleTimes = medication.schedules.length ? medication.schedules.map((schedule) => schedule.timeOfDay) : ["Unscheduled"];

    return scheduleTimes.map((scheduleTime) => {
      const normalizedSchedule = scheduleTime === "Unscheduled" ? null : scheduleTime;
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
  });

  const todayTaken = todayDoseRows.filter((row) => row.status === "TAKEN").length;
  const todayMissedOrSkipped = todayDoseRows.filter((row) => row.status === "MISSED" || row.status === "SKIPPED").length;
  const todayUnlogged = todayDoseRows.filter((row) => row.status === "UNLOGGED").length;
  const todayCompletionRate = todayDoseRows.length > 0 ? Math.round((todayTaken / todayDoseRows.length) * 100) : 0;

  const medsWithoutSchedules = activeMedications.filter((medication) => medication.schedules.length === 0);
  const medsWithoutDoctor = activeMedications.filter((medication) => !medication.doctorId);
  const endingSoon = activeMedications
    .filter((medication) => medication.endDate && medication.endDate >= now && medication.endDate <= nextThirtyDays)
    .sort((a, b) => Number(a.endDate) - Number(b.endDate));
  const expiredButActive = activeMedications.filter((medication) => medication.endDate && medication.endDate < now);

  const highSeverityMedicationAlerts = openMedicationAlerts.filter(
    (alert) => alert.severity === AlertSeverity.HIGH || alert.severity === AlertSeverity.CRITICAL
  );

  const safetyItems: MedicationSafetyItem[] = [
    ...highSeverityMedicationAlerts.map((alert) => ({
      id: `alert-${alert.id}`,
      title: alert.title,
      description: alert.message,
      tone: "danger" as const,
      priority: alert.severity === AlertSeverity.CRITICAL ? "Critical" as const : "High" as const,
      action: "Review the adherence alert and resolve or acknowledge it from the Alert Center.",
    })),
    ...expiredButActive.map((medication) => ({
      id: `expired-${medication.id}`,
      title: `${medication.name} is still active after its end date`,
      description: `This medication ended on ${medication.endDate?.toLocaleDateString("en-PH") ?? "a past date"} but is still marked active.`,
      tone: "danger" as const,
      priority: "High" as const,
      action: "Confirm whether the medication should be completed, renewed, or updated.",
    })),
    ...medsWithoutSchedules.map((medication) => ({
      id: `schedule-${medication.id}`,
      title: `${medication.name} has no dose schedule`,
      description: "A medication without schedule times is harder to track for adherence.",
      tone: "warning" as const,
      priority: "Medium" as const,
      action: "Add at least one schedule time or clarify that this is an as-needed medication.",
    })),
    ...endingSoon.slice(0, 5).map((medication) => ({
      id: `ending-${medication.id}`,
      title: `${medication.name} ends soon`,
      description: `Current end date is ${medication.endDate?.toLocaleDateString("en-PH")}.`,
      tone: "info" as const,
      priority: "Low" as const,
      action: "Prepare a refill, renewal, or doctor follow-up if this medication should continue.",
    })),
    ...medsWithoutDoctor.slice(0, 5).map((medication) => ({
      id: `doctor-${medication.id}`,
      title: `${medication.name} has no linked doctor`,
      description: "Linking a prescribing doctor improves handoff reports and care-team review.",
      tone: "neutral" as const,
      priority: "Low" as const,
      action: "Attach a doctor/provider to the medication record when available.",
    })),
  ];

  const readinessChecks = [
    {
      label: "Active medications documented",
      complete: activeMedications.length > 0,
      detail: activeMedications.length > 0 ? `${activeMedications.length} active medication(s)` : "No active medications yet",
    },
    {
      label: "Dose schedules configured",
      complete: activeMedications.length > 0 && medsWithoutSchedules.length === 0,
      detail: medsWithoutSchedules.length === 0 ? "Every active medication has a schedule" : `${medsWithoutSchedules.length} medication(s) need schedule times`,
    },
    {
      label: "Today has adherence activity",
      complete: todayTaken + todayMissedOrSkipped > 0 || todayDoseRows.length === 0,
      detail: todayDoseRows.length === 0 ? "No scheduled dose rows today" : `${todayTaken + todayMissedOrSkipped} logged dose(s) today`,
    },
    {
      label: "No high-risk medication alerts",
      complete: highSeverityMedicationAlerts.length === 0,
      detail: highSeverityMedicationAlerts.length === 0 ? "No high-risk medication alerts open" : `${highSeverityMedicationAlerts.length} high-risk alert(s) open`,
    },
    {
      label: "No active expired medications",
      complete: expiredButActive.length === 0,
      detail: expiredButActive.length === 0 ? "No expired active medications" : `${expiredButActive.length} medication(s) need review`,
    },
  ];

  const readinessScore = Math.round((readinessChecks.filter((check) => check.complete).length / readinessChecks.length) * 100);

  const medicationCards = activeMedications.map((medication) => {
    const medLogs = logs30Days.filter((log) => log.medicationId === medication.id);
    const taken = medLogs.filter((log) => log.status === MedicationLogStatus.TAKEN).length;
    const missed = medLogs.filter((log) => log.status === MedicationLogStatus.MISSED).length;
    const skipped = medLogs.filter((log) => log.status === MedicationLogStatus.SKIPPED).length;
    const logged = taken + missed + skipped;
    const adherence = logged > 0 ? Math.round((taken / logged) * 100) : 0;
    const daysUntilEnd = medication.endDate ? differenceInCalendarDays(medication.endDate, now) : null;

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
      tone: logged === 0 ? "neutral" as const : adherenceTone(adherence),
    };
  });

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
    },
    readinessChecks,
    safetyItems: safetyItems.slice(0, 12),
    todayDoseRows,
    medicationCards,
    medicationReminders,
    openMedicationAlerts,
  };
}
