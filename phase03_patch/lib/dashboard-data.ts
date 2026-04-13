import { format, subDays } from "date-fns";
import { db } from "@/lib/db";

export async function getDashboardData(userId: string) {
  const [
    profile,
    medications,
    appointments,
    labs,
    vitals,
    symptoms,
    reminders,
    medicationLogs,
  ] = await Promise.all([
    db.healthProfile.findUnique({ where: { userId } }),
    db.medication.findMany({
      where: { userId },
      include: { schedules: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.appointment.findMany({
      where: { userId },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
    db.labResult.findMany({
      where: { userId },
      orderBy: { dateTaken: "desc" },
      take: 5,
    }),
    db.vitalRecord.findMany({
      where: { userId },
      orderBy: { recordedAt: "desc" },
      take: 20,
    }),
    db.symptomEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.reminder.findMany({
      where: {
        userId,
        state: {
          in: ["DUE", "SENT", "OVERDUE"] as any,
        },
      } as any,
      orderBy: { dueAt: "asc" },
      take: 6,
    }),
    db.medicationLog.findMany({
      where: {
        userId,
        loggedAt: {
          gte: subDays(new Date(), 7),
        },
      },
      orderBy: { loggedAt: "desc" },
    }),
  ]);

  const adherenceByDay = Array.from({ length: 7 }).map((_, index) => {
    const date = subDays(new Date(), 6 - index);
    const key = format(date, "yyyy-MM-dd");
    const dayLogs = medicationLogs.filter(
      (log: (typeof medicationLogs)[number]) => format(log.loggedAt, "yyyy-MM-dd") === key
    );

    const taken = dayLogs.filter(
      (log: (typeof medicationLogs)[number]) => log.status === "TAKEN"
    ).length;
    const total = dayLogs.length || 1;

    return {
      label: format(date, "MMM d"),
      adherence: Math.round((taken / total) * 100),
    };
  });

  const bloodPressureTrend = vitals
    .filter((v: (typeof vitals)[number]) => v.systolic != null && v.diastolic != null)
    .slice()
    .reverse()
    .map((v: (typeof vitals)[number]) => ({
      label: format(v.recordedAt, "MMM d"),
      systolic: v.systolic ?? 0,
      diastolic: v.diastolic ?? 0,
    }));

  const weightTrend = vitals
    .filter((v: (typeof vitals)[number]) => v.weightKg != null)
    .slice()
    .reverse()
    .map((v: (typeof vitals)[number]) => ({
      label: format(v.recordedAt, "MMM d"),
      value: v.weightKg ?? 0,
    }));

  const sugarTrend = vitals
    .filter((v: (typeof vitals)[number]) => v.bloodSugar != null)
    .slice()
    .reverse()
    .map((v: (typeof vitals)[number]) => ({
      label: format(v.recordedAt, "MMM d"),
      value: v.bloodSugar ?? 0,
    }));

  const nextMedication = medications[0] ?? null;

  const profileFields = profile
    ? [
        profile.fullName,
        profile.dateOfBirth,
        profile.sex,
        profile.bloodType,
        profile.heightCm,
        profile.weightKg,
        profile.emergencyContactName,
        profile.emergencyContactPhone,
        profile.allergiesSummary,
        profile.chronicConditions,
      ]
    : [];

  const filledProfileFields = profileFields.filter(
    (value) => value !== null && value !== undefined && value !== ""
  ).length;

  const profileCompletion = profile
    ? Math.round((filledProfileFields / profileFields.length) * 100)
    : 0;

  return {
    profile,
    medications,
    appointments,
    labs,
    vitals,
    symptoms,
    reminders,
    medicationLogs,
    adherenceByDay,
    adherenceTrend: adherenceByDay,
    openAlerts: await db.alertEvent.findMany({
      where: {
        userId,
        status: "OPEN",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
      select: {
        id: true,
        title: true,
        message: true,
        severity: true,
        createdAt: true,
        rule: {
          select: {
            name: true,
          },
        },
      },
    }),
    nextMedication,
    profileCompletion,
    bloodPressureTrend,
    weightTrend,
    sugarTrend,
  };
}