import { db } from "@/lib/db";

export async function getPatientSummaryData(userId: string) {
  const generatedAt = new Date();

  const [
    profile,
    meds,
    appointments,
    labs,
    vitals,
    symptoms,
    vaccinations,
    reminders,
    docs,
    alerts,
    latestInsight,
    careAccess,
  ] = await Promise.all([
    db.healthProfile.findUnique({ where: { userId } }),
    db.medication.findMany({
      where: { userId },
      include: { schedules: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    db.appointment.findMany({
      where: { userId },
      orderBy: { scheduledAt: "desc" },
      take: 8,
    }),
    db.labResult.findMany({
      where: { userId },
      orderBy: { dateTaken: "desc" },
      take: 8,
    }),
    db.vitalRecord.findMany({
      where: { userId },
      orderBy: { recordedAt: "desc" },
      take: 8,
    }),
    db.symptomEntry.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 8,
    }),
    db.vaccinationRecord.findMany({
      where: { userId },
      orderBy: { dateTaken: "desc" },
      take: 8,
    }),
    db.reminder.findMany({
      where: { userId },
      orderBy: { dueAt: "asc" },
      take: 8,
    }),
    db.medicalDocument.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.alertEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.aiInsight.findFirst({
      where: { ownerUserId: userId },
      orderBy: { createdAt: "desc" },
    }),
    db.careAccess.findMany({
      where: { ownerUserId: userId, status: "ACTIVE" },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return {
    generatedAt,
    profile,
    meds,
    appointments,
    labs,
    vitals,
    symptoms,
    vaccinations,
    reminders,
    docs,
    alerts,
    latestInsight,
    careAccess,
    stats: {
      medications: meds.length,
      appointments: appointments.length,
      labs: labs.length,
      vitals: vitals.length,
      symptoms: symptoms.length,
      vaccinations: vaccinations.length,
      reminders: reminders.length,
      documents: docs.length,
      alerts: alerts.length,
      careMembers: careAccess.length,
      hasInsight: latestInsight ? 1 : 0,
    },
  };
}

export type PatientSummaryData = Awaited<ReturnType<typeof getPatientSummaryData>>;
