import { AppointmentStatus, LabFlag, ReminderState, SymptomSeverity } from "@prisma/client";
import { db } from "@/lib/db";

export type TimelineTone = "info" | "neutral" | "success" | "warning" | "danger";

export type TimelineItemType =
  | "APPOINTMENT"
  | "LAB_RESULT"
  | "VITAL"
  | "SYMPTOM"
  | "VACCINATION"
  | "DOCUMENT"
  | "REMINDER"
  | "ALERT";

export type TimelineItem = {
  id: string;
  type: TimelineItemType;
  title: string;
  description: string;
  occurredAt: Date;
  href: string;
  tone: TimelineTone;
};

function getAppointmentTone(status: AppointmentStatus): TimelineTone {
  switch (status) {
    case AppointmentStatus.COMPLETED:
      return "success";
    case AppointmentStatus.CANCELLED:
      return "warning";
    default:
      return "info";
  }
}

function getLabTone(flag: LabFlag): TimelineTone {
  switch (flag) {
    case LabFlag.HIGH:
    case LabFlag.LOW:
      return "warning";
    case LabFlag.BORDERLINE:
      return "info";
    default:
      return "neutral";
  }
}

function getSymptomTone(severity: SymptomSeverity, resolved: boolean): TimelineTone {
  if (resolved) return "success";
  switch (severity) {
    case SymptomSeverity.SEVERE:
      return "danger";
    case SymptomSeverity.MODERATE:
      return "warning";
    default:
      return "info";
  }
}

function getReminderTone(state: ReminderState, completed: boolean): TimelineTone {
  if (completed || state === ReminderState.COMPLETED) return "success";
  if (state === ReminderState.MISSED || state === ReminderState.OVERDUE) return "warning";
  if (state === ReminderState.SKIPPED) return "neutral";
  return "info";
}

export async function getTimelineItems(userId: string, limit = 100): Promise<TimelineItem[]> {
  const [appointments, labs, vitals, symptoms, vaccinations, documents, reminders, alerts] = await Promise.all([
    db.appointment.findMany({
      where: { userId },
      orderBy: { scheduledAt: "desc" },
      take: limit,
    }),
    db.labResult.findMany({
      where: { userId },
      orderBy: { dateTaken: "desc" },
      take: limit,
    }),
    db.vitalRecord.findMany({
      where: { userId },
      orderBy: { recordedAt: "desc" },
      take: limit,
    }),
    db.symptomEntry.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: limit,
    }),
    db.vaccinationRecord.findMany({
      where: { userId },
      orderBy: { dateTaken: "desc" },
      take: limit,
    }),
    db.medicalDocument.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    db.reminder.findMany({
      where: { userId },
      orderBy: { dueAt: "desc" },
      take: limit,
    }),
    db.alertEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);

  const items: TimelineItem[] = [
    ...appointments.map((item): TimelineItem => ({
      id: item.id,
      type: "APPOINTMENT",
      title: item.doctorName || item.clinic || "Appointment",
      description: item.purpose,
      occurredAt: item.scheduledAt,
      href: "/appointments",
      tone: getAppointmentTone(item.status),
    })),
    ...labs.map((item): TimelineItem => ({
      id: item.id,
      type: "LAB_RESULT",
      title: item.testName,
      description: item.resultSummary,
      occurredAt: item.dateTaken,
      href: "/labs",
      tone: getLabTone(item.flag),
    })),
    ...vitals.map((item): TimelineItem => ({
      id: item.id,
      type: "VITAL",
      title: "Vital record",
      description:
        [
          item.systolic && item.diastolic ? `BP ${item.systolic}/${item.diastolic}` : null,
          item.heartRate ? `HR ${item.heartRate}` : null,
          item.temperatureC ? `Temp ${item.temperatureC}°C` : null,
          item.bloodSugar ? `Sugar ${item.bloodSugar}` : null,
          item.oxygenSaturation ? `SpO2 ${item.oxygenSaturation}%` : null,
        ]
          .filter(Boolean)
          .join(" • ") || "Vital record added",
      occurredAt: item.recordedAt,
      href: "/vitals",
      tone: "info",
    })),
    ...symptoms.map((item): TimelineItem => ({
      id: item.id,
      type: "SYMPTOM",
      title: item.title,
      description: item.notes || item.bodyArea || item.duration || "Symptom recorded",
      occurredAt: item.startedAt,
      href: "/symptoms",
      tone: getSymptomTone(item.severity, item.resolved),
    })),
    ...vaccinations.map((item): TimelineItem => ({
      id: item.id,
      type: "VACCINATION",
      title: item.vaccineName,
      description: `Dose ${item.doseNumber}${item.location ? ` • ${item.location}` : ""}`,
      occurredAt: item.dateTaken,
      href: "/vaccinations",
      tone: "success",
    })),
    ...documents.map((item): TimelineItem => ({
      id: item.id,
      type: "DOCUMENT",
      title: item.title,
      description: `${item.type} • ${item.fileName}`,
      occurredAt: item.createdAt,
      href: "/documents",
      tone: "neutral",
    })),
    ...reminders.map((item): TimelineItem => ({
      id: item.id,
      type: "REMINDER",
      title: item.title,
      description: item.description || item.type.replaceAll("_", " "),
      occurredAt: item.dueAt,
      href: "/reminders",
      tone: getReminderTone(item.state, item.completed),
    })),
    ...alerts.map((item): TimelineItem => ({
      id: item.id,
      type: "ALERT",
      title: item.title,
      description: item.message,
      occurredAt: item.createdAt,
      href: `/alerts/${item.id}`,
      tone:
        item.severity === "CRITICAL"
          ? "danger"
          : item.severity === "HIGH"
            ? "warning"
            : item.status === "RESOLVED"
              ? "success"
              : "info",
    })),
  ];

  return items.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()).slice(0, limit);
}
