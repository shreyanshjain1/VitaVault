import { LabFlag } from "@prisma/client";
import { db } from "@/lib/db";

export type TimelineTone = "info" | "neutral" | "success" | "warning" | "danger";

export type TimelineItem = {
  id: string;
  type:
    | "APPOINTMENT"
    | "LAB_RESULT"
    | "VITAL"
    | "SYMPTOM"
    | "MEDICATION_LOG"
    | "REMINDER"
    | "DOCUMENT"
    | "VACCINATION";
  title: string;
  description: string;
  occurredAt: Date;
  href: string;
  tone: TimelineTone;
};

export async function getTimelineItems(userId: string): Promise<TimelineItem[]> {
  const [appointments, labs, vitals, symptoms, medicationLogs, reminders, documents, vaccinations] =
    await Promise.all([
      db.appointment.findMany({ where: { userId }, orderBy: { scheduledAt: "desc" }, take: 12 }),
      db.labResult.findMany({ where: { userId }, orderBy: { dateTaken: "desc" }, take: 12 }),
      db.vitalRecord.findMany({ where: { userId }, orderBy: { recordedAt: "desc" }, take: 12 }),
      db.symptomEntry.findMany({ where: { userId }, orderBy: { startedAt: "desc" }, take: 12 }),
      db.medicationLog.findMany({ where: { userId }, include: { medication: true }, orderBy: { loggedAt: "desc" }, take: 12 }),
      db.reminder.findMany({ where: { userId }, orderBy: { dueAt: "desc" }, take: 12 }),
      db.medicalDocument.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 12 }),
      db.vaccinationRecord.findMany({ where: { userId }, orderBy: { dateTaken: "desc" }, take: 12 }),
    ]);

  const items: TimelineItem[] = [
    ...appointments.map((item) => ({
      id: item.id,
      type: "APPOINTMENT" as const,
      title: `Appointment: ${item.doctorName}`,
      description: `${item.clinic} • ${item.purpose}`,
      occurredAt: item.scheduledAt,
      href: "/appointments",
      tone: item.status === "CANCELLED" ? "warning" : item.status === "COMPLETED" ? "success" : "info",
    })),
    ...labs.map((item) => ({
      id: item.id,
      type: "LAB_RESULT" as const,
      title: item.testName,
      description: item.resultSummary,
      occurredAt: item.dateTaken,
      href: "/labs",
      tone:
        item.flag === LabFlag.HIGH || item.flag === LabFlag.LOW
          ? "warning"
          : item.flag === LabFlag.BORDERLINE
          ? "info"
          : "neutral",
    })),
    ...vitals.map((item) => ({
      id: item.id,
      type: "VITAL" as const,
      title: "Vital record",
      description:
        [
          item.systolic != null && item.diastolic != null ? `BP ${item.systolic}/${item.diastolic}` : null,
          item.heartRate != null ? `HR ${item.heartRate}` : null,
          item.bloodSugar != null ? `Sugar ${item.bloodSugar}` : null,
          item.oxygenSaturation != null ? `SpO₂ ${item.oxygenSaturation}%` : null,
        ]
          .filter(Boolean)
          .join(" • ") || "Recorded vitals",
      occurredAt: item.recordedAt,
      href: "/vitals",
      tone: "info",
    })),
    ...symptoms.map((item) => ({
      id: item.id,
      type: "SYMPTOM" as const,
      title: item.title,
      description: `${item.severity}${item.resolved ? " • resolved" : ""}`,
      occurredAt: item.startedAt,
      href: "/symptoms",
      tone: item.severity === "SEVERE" ? "danger" : item.severity === "MODERATE" ? "warning" : "info",
    })),
    ...medicationLogs.map((item) => ({
      id: item.id,
      type: "MEDICATION_LOG" as const,
      title: `${item.medication.name} log`,
      description: `${item.status}${item.scheduleTime ? ` • ${item.scheduleTime}` : ""}`,
      occurredAt: item.loggedAt,
      href: "/medications",
      tone: item.status === "TAKEN" ? "success" : item.status === "MISSED" ? "danger" : "warning",
    })),
    ...reminders.map((item) => ({
      id: item.id,
      type: "REMINDER" as const,
      title: item.title,
      description: item.description ?? item.type,
      occurredAt: item.dueAt,
      href: "/reminders",
      tone:
        item.state === "COMPLETED"
          ? "success"
          : item.state === "MISSED"
          ? "danger"
          : item.state === "OVERDUE"
          ? "warning"
          : "neutral",
    })),
    ...documents.map((item) => ({
      id: item.id,
      type: "DOCUMENT" as const,
      title: item.title,
      description: item.type,
      occurredAt: item.createdAt,
      href: "/documents",
      tone: "neutral",
    })),
    ...vaccinations.map((item) => ({
      id: item.id,
      type: "VACCINATION" as const,
      title: item.vaccineName,
      description: `Dose ${item.doseNumber}`,
      occurredAt: item.dateTaken,
      href: "/vaccinations",
      tone: "success",
    })),
  ];

  return items.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
}
