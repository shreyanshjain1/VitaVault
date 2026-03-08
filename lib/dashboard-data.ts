import { db } from "@/lib/db";
import { format, subDays } from "date-fns";
export async function getDashboardData(userId: string) {
  const [profile, medications, appointments, labs, vitals, symptoms, reminders, medicationLogs] = await Promise.all([
    db.healthProfile.findUnique({ where: { userId } }),
    db.medication.findMany({ where: { userId }, include: { schedules: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.appointment.findMany({ where: { userId }, orderBy: { scheduledAt: "asc" }, take: 5 }),
    db.labResult.findMany({ where: { userId }, orderBy: { dateTaken: "desc" }, take: 5 }),
    db.vitalRecord.findMany({ where: { userId }, orderBy: { recordedAt: "asc" }, take: 12 }),
    db.symptomEntry.findMany({ where: { userId }, orderBy: { startedAt: "desc" }, take: 5 }),
    db.reminder.findMany({ where: { userId, completed: false }, orderBy: { dueAt: "asc" }, take: 5 }),
    db.medicationLog.findMany({ where: { userId, loggedAt: { gte: subDays(new Date(), 6) } }, orderBy: { loggedAt: "asc" } })
  ]);
  const profileCompletion = [profile?.fullName, profile?.dateOfBirth, profile?.sex, profile?.bloodType, profile?.heightCm, profile?.weightKg, profile?.emergencyContactName, profile?.allergiesSummary].filter(Boolean).length;
  const bloodPressureTrend = vitals.map(v => ({ label: format(v.recordedAt, "MMM d"), systolic: v.systolic, diastolic: v.diastolic }));
  const weightTrend = vitals.map(v => ({ label: format(v.recordedAt, "MMM d"), weight: v.weightKg }));
  const sugarTrend = vitals.map(v => ({ label: format(v.recordedAt, "MMM d"), sugar: v.bloodSugar }));
  const adherence = new Map<string, { label: string; taken: number; missed: number }>();
  for (let i=6;i>=0;i--) { const d=subDays(new Date(), i); adherence.set(format(d, "MMM d"), { label: format(d, "MMM d"), taken: 0, missed: 0 }); }
  medicationLogs.forEach(log => { const e = adherence.get(format(log.loggedAt, "MMM d")); if (!e) return; if (log.status==="TAKEN") e.taken += 1; if (log.status==="MISSED") e.missed += 1; });
  const nextMedication = medications.flatMap(m => m.schedules.map(s => ({ name: m.name, time: s.timeOfDay }))).sort((a,b)=>a.time.localeCompare(b.time))[0];
  const healthAlerts = [
    ...labs.filter(l => l.flag !== "NORMAL").map(l => `${l.testName} marked ${l.flag.toLowerCase()}`),
    ...symptoms.filter(s => !s.resolved).map(s => `Unresolved symptom: ${s.title}`)
  ];
  return { profile, medications, appointments, labs, vitals, symptoms, reminders, profileCompletion: Math.round((profileCompletion/8)*100), bloodPressureTrend, weightTrend, sugarTrend, adherenceTrend: Array.from(adherence.values()), nextMedication, healthAlerts };
}
