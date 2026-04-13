import { db } from "@/lib/db";

export type TimelineItem = {
  id: string;
  type:
    | "APPOINTMENT"
    | "LAB_RESULT"
    | "VITAL"
    | "SYMPTOM"
    | "MEDICATION_LOG"
    | "DOCUMENT"
    | "VACCINATION"
    | "REMINDER"
    | "ALERT";
  title: string;
  description: string;
  occurredAt: Date;
  href: string;
  tone: "neutral" | "info" | "success" | "warning" | "danger";
};

export async function getPatientTimeline(userId: string, limit = 60): Promise<TimelineItem[]> {
  const [appointments, labs, vitals, symptoms, medicationLogs, documents, vaccinations, reminders, alerts] =
    await Promise.all([
      db.appointment.findMany({ where: { userId }, orderBy: { scheduledAt: "desc" }, take: 10 }),
      db.labResult.findMany({ where: { userId }, orderBy: { dateTaken: "desc" }, take: 10 }),
      db.vitalRecord.findMany({ where: { userId }, orderBy: { recordedAt: "desc" }, take: 12 }),
      db.symptomEntry.findMany({ where: { userId }, orderBy: { startedAt: "desc" }, take: 10 }),
      db.medicationLog.findMany({
        where: { userId },
        include: { medication: { select: { name: true, dosage: true } } },
        orderBy: { loggedAt: "desc" },
        take: 12,
      }),
      db.medicalDocument.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10 }),
      db.vaccinationRecord.findMany({ where: { userId }, orderBy: { dateTaken: "desc" }, take: 10 }),
      db.reminder.findMany({ where: { userId }, orderBy: { dueAt: "desc" }, take: 10 }),
      db.alertEvent.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 12 }),
    ]);

  const items: TimelineItem[] = [
    ...appointments.map((item) => ({
      id: item.id,
      type: "APPOINTMENT" as const,
      title: item.doctorName || item.clinic,
      description: `${item.purpose} • ${item.status}`,
      occurredAt: item.scheduledAt,
      href: "/appointments",
      tone: item.status === "MISSED" ? "warning" : "info",
    })),
    ...labs.map((item) => ({
      id: item.id,
      type: "LAB_RESULT" as const,
      title: item.testName,
      description: `${item.flag}${item.resultSummary ? ` • ${item.resultSummary}` : ""}`,
      occurredAt: item.dateTaken,
      href: "/labs",
      tone: item.flag === "CRITICAL" ? "danger" : item.flag === "ABNORMAL" ? "warning" : "neutral",
    })),
    ...vitals.map((item) => ({
      id: item.id,
      type: "VITAL" as const,
      title: "Vital record",
      description: [
        item.systolic != null && item.diastolic != null ? `BP ${item.systolic}/${item.diastolic}` : null,
        item.heartRate != null ? `HR ${item.heartRate}` : null,
        item.bloodSugar != null ? `Sugar ${item.bloodSugar}` : null,
        item.temperatureC != null ? `Temp ${item.temperatureC}°C` : null,
      ]
        .filter(Boolean)
        .join(" • ") || "Vital entry recorded",
      occurredAt: item.recordedAt,
      href: "/vitals",
      tone: "info",
    })),
    ...symptoms.map((item) => ({
      id: item.id,
      type: "SYMPTOM" as const,
      title: item.title,
      description: `${item.severity}${item.resolved ? " • Resolved" : " • Active"}`,
      occurredAt: item.startedAt,
      href: "/symptoms",
      tone: item.severity === "SEVERE" ? "danger" : item.severity === "MODERATE" ? "warning" : "neutral",
    })),
    ...medicationLogs.map((item) => ({
      id: item.id,
      type: "MEDICATION_LOG" as const,
      title: item.medication.name,
      description: `${item.status}${item.scheduleTime ? ` • ${item.scheduleTime}` : ""}`,
      occurredAt: item.loggedAt,
      href: "/medications",
      tone: item.status === "MISSED" ? "warning" : item.status === "TAKEN" ? "success" : "neutral",
    })),
    ...documents.map((item) => ({
      id: item.id,
      type: "DOCUMENT" as const,
      title: item.title,
      description: `${item.type} • ${item.fileName}`,
      occurredAt: item.createdAt,
      href: "/documents",
      tone: "neutral",
    })),
    ...vaccinations.map((item) => ({
      id: item.id,
      type: "VACCINATION" as const,
      title: item.vaccineName,
      description: `Dose ${item.doseNumber}${item.location ? ` • ${item.location}` : ""}`,
      occurredAt: item.dateTaken,
      href: "/vaccinations",
      tone: "success",
    })),
    ...reminders.map((item) => ({
      id: item.id,
      type: "REMINDER" as const,
      title: item.title,
      description: `${item.type} • ${item.state}`,
      occurredAt: item.dueAt,
      href: "/reminders",
      tone: item.state === "OVERDUE" ? "warning" : item.completed ? "success" : "info",
    })),
    ...alerts.map((item) => ({
      id: item.id,
      type: "ALERT" as const,
      title: item.title,
      description: `${item.severity} • ${item.status}`,
      occurredAt: item.createdAt,
      href: `/alerts/${item.id}`,
      tone: item.severity === "CRITICAL" ? "danger" : item.severity === "HIGH" ? "warning" : item.severity === "MEDIUM" ? "info" : "neutral",
    })),
  ];

  return items
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, limit);
}
