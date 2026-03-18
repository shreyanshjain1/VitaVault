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
    openAlerts,
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
      where: { userId, completed: false },
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
    db.alertEvent.findMany({
      where: { userId, status: "OPEN" },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 6,
      include: { rule: true },
    }),
  ]);

  const adherenceByDay = Array.from({ length: 7 }).map((_, index) => {
    const date = subDays(new Date(), 6 - index);
    const key = format(date, "yyyy-MM-dd");
    const dayLogs = medicationLogs.filter(
      (log) => format(log.loggedAt, "yyyy-MM-dd") === key
    );

    const taken = dayLogs.filter((log) => log.status === "TAKEN").length;
    const total = dayLogs.length || 1;

    return {
      label: format(date, "MMM d"),
      adherence: Math.round((taken / total) * 100),
    };
  });

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
    openAlerts,
  };
}
