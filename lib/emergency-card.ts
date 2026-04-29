import { db } from "@/lib/db";

export async function getEmergencyCardData(userId: string) {
  const [user, profile, medications, doctors, latestVitals, severeSymptoms] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    }),
    db.healthProfile.findUnique({
      where: { userId },
    }),
    db.medication.findMany({
      where: { userId, status: "ACTIVE", active: true },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: 8,
      include: {
        doctor: {
          select: {
            name: true,
            specialty: true,
            phone: true,
          },
        },
      },
    }),
    db.doctor.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: 4,
      select: {
        id: true,
        name: true,
        specialty: true,
        clinic: true,
        phone: true,
        email: true,
      },
    }),
    db.vitalRecord.findFirst({
      where: { userId },
      orderBy: { recordedAt: "desc" },
    }),
    db.symptomEntry.findMany({
      where: { userId, resolved: false, severity: "SEVERE" },
      orderBy: { startedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        severity: true,
        startedAt: true,
        bodyArea: true,
      },
    }),
  ]);

  const patientName = profile?.fullName ?? user?.name ?? user?.email ?? "VitaVault patient";
  const criticalProfileItems = [
    profile?.allergiesSummary ? null : "Allergies not documented",
    profile?.emergencyContactName && profile.emergencyContactPhone ? null : "Emergency contact incomplete",
    profile?.bloodType ? null : "Blood type not documented",
    medications.length ? null : "No active medications listed",
  ].filter(Boolean) as string[];

  return {
    generatedAt: new Date(),
    user,
    profile,
    patientName,
    medications,
    doctors,
    latestVitals,
    severeSymptoms,
    criticalProfileItems,
  };
}

export type EmergencyCardData = Awaited<ReturnType<typeof getEmergencyCardData>>;
