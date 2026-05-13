import {
  AlertSeverity,
  AlertStatus,
  AppointmentStatus,
  LabFlag,
  MedicationStatus,
  ReminderState,
} from "@prisma/client";
import { db } from "@/lib/db";

export type VisitPrepPriority = "critical" | "high" | "medium" | "low";

export type VisitPrepTask = {
  title: string;
  detail: string;
  priority: VisitPrepPriority;
  href: string;
};

export type VisitTimelineSource =
  | "appointment"
  | "reminder"
  | "lab"
  | "symptom"
  | "vital"
  | "document";

export type VisitTimelineBucket =
  | "visit-window"
  | "before-visit"
  | "after-visit"
  | "recent-context";

export type VisitPrepTimelineItem = {
  id: string;
  title: string;
  detail: string;
  at: Date;
  source: VisitTimelineSource;
  href: string;
  bucket: VisitTimelineBucket;
  proximityLabel: string;
  actionLabel: string;
};

export type VisitReadinessState =
  | "ready"
  | "needs-review"
  | "blocked"
  | "no-visit";

export type VisitReadinessSignal = {
  state: VisitReadinessState;
  label: string;
  description: string;
  nextStep: string;
  tone: "neutral" | "info" | "success" | "warning" | "danger";
};

export type VisitTimelineGroup = {
  bucket: VisitTimelineBucket;
  label: string;
  description: string;
  items: VisitPrepTimelineItem[];
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function priorityRank(priority: VisitPrepPriority) {
  if (priority === "critical") return 4;
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

function getAlertPriority(severity: AlertSeverity): VisitPrepPriority {
  if (severity === AlertSeverity.CRITICAL) return "critical";
  if (severity === AlertSeverity.HIGH) return "high";
  if (severity === AlertSeverity.MEDIUM) return "medium";
  return "low";
}

function daysBetween(from: Date, to: Date) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.round((to.getTime() - from.getTime()) / millisecondsPerDay);
}

export function formatVisitCountdown(
  appointmentAt: Date | null | undefined,
  now = new Date(),
) {
  if (!appointmentAt) return "No visit scheduled";

  const days = daysBetween(now, appointmentAt);

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1) return `In ${days} days`;
  if (days === -1) return "Yesterday";
  return `${Math.abs(days)} days ago`;
}

export function getVisitPrepActionLabel(source: VisitTimelineSource) {
  if (source === "appointment") return "Confirm visit details";
  if (source === "reminder") return "Resolve reminder";
  if (source === "lab") return "Review result";
  if (source === "symptom") return "Discuss symptom";
  if (source === "vital") return "Check trend";
  return "Attach to visit packet";
}

export function getVisitTimelineBucket(
  itemAt: Date,
  nextAppointmentAt: Date | null | undefined,
  now = new Date(),
): VisitTimelineBucket {
  if (!nextAppointmentAt) return "recent-context";

  const daysFromVisit = daysBetween(nextAppointmentAt, itemAt);
  const daysFromNow = daysBetween(now, itemAt);

  if (Math.abs(daysFromVisit) <= 1) return "visit-window";
  if (daysFromVisit < 0 && daysFromVisit >= -30) return "before-visit";
  if (daysFromVisit > 1 && daysFromVisit <= 30) return "after-visit";
  if (Math.abs(daysFromNow) <= 90) return "recent-context";
  return "recent-context";
}

export function formatTimelineProximity(
  itemAt: Date,
  nextAppointmentAt: Date | null | undefined,
  now = new Date(),
) {
  if (!nextAppointmentAt) return formatVisitCountdown(itemAt, now);

  const days = daysBetween(nextAppointmentAt, itemAt);

  if (days === 0) return "Visit day";
  if (days === -1) return "1 day before visit";
  if (days < -1) return `${Math.abs(days)} days before visit`;
  if (days === 1) return "1 day after visit";
  return `${days} days after visit`;
}

export function getVisitReadinessSignal({
  readinessScore,
  criticalTasks,
  highTasks,
  hasNextAppointment,
}: {
  readinessScore: number;
  criticalTasks: number;
  highTasks: number;
  hasNextAppointment: boolean;
}): VisitReadinessSignal {
  if (!hasNextAppointment) {
    return {
      state: "no-visit",
      label: "No visit selected",
      description:
        "Add an upcoming appointment so VitaVault can anchor the packet around a visit date.",
      nextStep: "Schedule or record the next appointment.",
      tone: "warning",
    };
  }

  if (criticalTasks > 0 || readinessScore < 50) {
    return {
      state: "blocked",
      label: "Needs urgent prep",
      description:
        "The visit packet has critical or high-impact gaps that should be reviewed before the appointment.",
      nextStep: "Start with critical tasks and unresolved safety signals.",
      tone: "danger",
    };
  }

  if (highTasks > 0 || readinessScore < 85) {
    return {
      state: "needs-review",
      label: "Needs review",
      description:
        "The visit packet is usable, but a few records or context items should be checked before sharing.",
      nextStep: "Review missing checklist items and high-priority tasks.",
      tone: "warning",
    };
  }

  return {
    state: "ready",
    label: "Visit-ready",
    description:
      "The core visit packet is prepared with the available health context.",
    nextStep: "Generate or print the doctor packet before the appointment.",
    tone: "success",
  };
}

function getTimelineGroupLabel(bucket: VisitTimelineBucket) {
  if (bucket === "visit-window") return "Visit window";
  if (bucket === "before-visit") return "Before visit";
  if (bucket === "after-visit") return "After visit";
  return "Recent context";
}

function getTimelineGroupDescription(bucket: VisitTimelineBucket) {
  if (bucket === "visit-window")
    return "Records from the appointment day or immediate visit window.";
  if (bucket === "before-visit")
    return "Recent context to review before the appointment.";
  if (bucket === "after-visit")
    return "Follow-up records and reminders after the appointment.";
  return "Helpful records that are not directly inside the appointment window.";
}

export function buildVisitTimelineGroups(
  items: VisitPrepTimelineItem[],
): VisitTimelineGroup[] {
  const order: VisitTimelineBucket[] = [
    "visit-window",
    "before-visit",
    "after-visit",
    "recent-context",
  ];

  return order
    .map((bucket) => ({
      bucket,
      label: getTimelineGroupLabel(bucket),
      description: getTimelineGroupDescription(bucket),
      items: items.filter((item) => item.bucket === bucket),
    }))
    .filter((group) => group.items.length > 0);
}

export async function getVisitPrepData(userId: string) {
  const now = new Date();
  const ninetyDaysAgo = addDays(now, -90);
  const thirtyDaysAgo = addDays(now, -30);
  const nextNinetyDays = addDays(now, 90);

  const [
    profile,
    upcomingAppointments,
    activeMedications,
    recentLabs,
    recentVitals,
    recentSymptoms,
    unresolvedSevereSymptoms,
    recentDocuments,
    unlinkedDocuments,
    doctors,
    dueReminders,
    openAlerts,
  ] = await Promise.all([
    db.healthProfile.findUnique({ where: { userId } }),
    db.appointment.findMany({
      where: {
        userId,
        status: AppointmentStatus.UPCOMING,
        scheduledAt: { gte: now, lte: nextNinetyDays },
      },
      orderBy: { scheduledAt: "asc" },
      take: 8,
      include: { doctor: true },
    }),
    db.medication.findMany({
      where: { userId, status: MedicationStatus.ACTIVE, active: true },
      orderBy: { name: "asc" },
      take: 12,
      include: {
        doctor: { select: { name: true, specialty: true, clinic: true } },
        schedules: { orderBy: { timeOfDay: "asc" } },
      },
    }),
    db.labResult.findMany({
      where: { userId, dateTaken: { gte: ninetyDaysAgo } },
      orderBy: { dateTaken: "desc" },
      take: 12,
    }),
    db.vitalRecord.findMany({
      where: { userId, recordedAt: { gte: ninetyDaysAgo } },
      orderBy: { recordedAt: "desc" },
      take: 8,
    }),
    db.symptomEntry.findMany({
      where: { userId, startedAt: { gte: ninetyDaysAgo } },
      orderBy: { startedAt: "desc" },
      take: 12,
    }),
    db.symptomEntry.findMany({
      where: { userId, severity: "SEVERE", resolved: false },
      orderBy: { startedAt: "desc" },
      take: 8,
    }),
    db.medicalDocument.findMany({
      where: { userId, createdAt: { gte: ninetyDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    db.medicalDocument.findMany({
      where: { userId, linkedRecordType: null },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.doctor.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    db.reminder.findMany({
      where: {
        userId,
        state: {
          in: [ReminderState.DUE, ReminderState.OVERDUE, ReminderState.SENT],
        },
        dueAt: { gte: thirtyDaysAgo, lte: nextNinetyDays },
      },
      orderBy: { dueAt: "asc" },
      take: 8,
    }),
    db.alertEvent.findMany({
      where: { userId, status: AlertStatus.OPEN },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
  ]);

  const nextAppointment = upcomingAppointments[0] ?? null;
  const nextAppointmentAt = nextAppointment?.scheduledAt ?? null;
  const abnormalLabs = recentLabs.filter((lab) => lab.flag !== LabFlag.NORMAL);
  const severeSymptoms = unresolvedSevereSymptoms;
  const hasEmergencyContext = Boolean(
    profile?.emergencyContactName && profile?.emergencyContactPhone,
  );
  const hasAllergyContext = Boolean(profile?.allergiesSummary?.trim());
  const hasMedicationContext = activeMedications.length > 0;
  const hasRecentVitals = recentVitals.length > 0;
  const hasRecentLabs = recentLabs.length > 0;
  const hasSymptoms = recentSymptoms.length > 0;
  const hasDoctors = doctors.length > 0;
  const hasRecentDocuments = recentDocuments.length > 0;

  const readinessChecks = [
    {
      label: "Upcoming appointment selected",
      complete: Boolean(nextAppointment),
      href: "/appointments",
    },
    {
      label: "Emergency contact available",
      complete: hasEmergencyContext,
      href: "/health-profile",
    },
    {
      label: "Allergy context documented",
      complete: hasAllergyContext,
      href: "/health-profile",
    },
    {
      label: "Active medication list available",
      complete: hasMedicationContext,
      href: "/medications",
    },
    {
      label: "Recent vitals available",
      complete: hasRecentVitals,
      href: "/vitals",
    },
    { label: "Recent labs available", complete: hasRecentLabs, href: "/labs" },
    {
      label: "Provider directory available",
      complete: hasDoctors,
      href: "/doctors",
    },
    {
      label: "Recent symptom journal reviewed",
      complete: hasSymptoms,
      href: "/symptoms",
    },
    {
      label: "Recent documents attached",
      complete: hasRecentDocuments,
      href: "/documents",
    },
  ];

  const readinessScore = Math.round(
    (readinessChecks.filter((item) => item.complete).length /
      readinessChecks.length) *
      100,
  );

  const tasks: VisitPrepTask[] = [];

  if (!nextAppointment) {
    tasks.push({
      title: "Schedule or record the next visit",
      detail:
        "Add the upcoming appointment so VitaVault can organize the packet around the visit date.",
      priority: "high",
      href: "/appointments",
    });
  }

  if (!hasEmergencyContext) {
    tasks.push({
      title: "Complete emergency contact details",
      detail:
        "Emergency contact name and phone help make the visit packet safer for handoff situations.",
      priority: "high",
      href: "/health-profile",
    });
  }

  if (!hasAllergyContext) {
    tasks.push({
      title: "Document allergies or no-known-allergies note",
      detail:
        "Medication and lab review is stronger when allergies are clearly documented.",
      priority: "medium",
      href: "/health-profile",
    });
  }

  if (!hasMedicationContext) {
    tasks.push({
      title: "Add active medications",
      detail:
        "A current medication list is one of the most important parts of a doctor visit packet.",
      priority: "high",
      href: "/medications",
    });
  }

  if (!hasRecentDocuments) {
    tasks.push({
      title: "Attach recent medical documents",
      detail:
        "Recent lab files, discharge summaries, prescriptions, or imaging reports make the visit packet stronger.",
      priority: "medium",
      href: "/documents",
    });
  }

  abnormalLabs.slice(0, 4).forEach((lab) => {
    tasks.push({
      title: `Review flagged lab: ${lab.testName}`,
      detail: `${lab.flag} result from ${lab.dateTaken.toLocaleDateString("en-PH")}: ${lab.resultSummary}`,
      priority: lab.flag === LabFlag.BORDERLINE ? "medium" : "high",
      href: `/labs?focus=${lab.id}`,
    });
  });

  severeSymptoms.slice(0, 4).forEach((symptom) => {
    tasks.push({
      title: `Discuss severe symptom: ${symptom.title}`,
      detail:
        symptom.notes ||
        "Unresolved severe symptom should be raised during the next provider conversation.",
      priority: "critical",
      href: `/symptoms?focus=${symptom.id}`,
    });
  });

  openAlerts.slice(0, 4).forEach((alert) => {
    tasks.push({
      title: alert.title,
      detail: alert.message,
      priority: getAlertPriority(alert.severity),
      href: `/alerts/${alert.id}`,
    });
  });

  if (unlinkedDocuments.length > 0) {
    tasks.push({
      title: "Link recent medical documents",
      detail: `${unlinkedDocuments.length} document${unlinkedDocuments.length === 1 ? "" : "s"} still need a linked appointment, lab result, or doctor context.`,
      priority: "medium",
      href: "/documents?link=UNLINKED",
    });
  }

  const sortedTasks = tasks
    .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority))
    .slice(0, 10);

  const readinessSignal = getVisitReadinessSignal({
    readinessScore,
    criticalTasks: sortedTasks.filter((task) => task.priority === "critical")
      .length,
    highTasks: sortedTasks.filter((task) => task.priority === "high").length,
    hasNextAppointment: Boolean(nextAppointment),
  });

  const timelineBase = [
    ...upcomingAppointments.map((appointment) => ({
      id: `appointment-${appointment.id}`,
      title: appointment.purpose,
      detail: `${appointment.doctorName} • ${appointment.clinic}`,
      at: appointment.scheduledAt,
      source: "appointment" as const,
      href: "/appointments",
    })),
    ...dueReminders.map((reminder) => ({
      id: `reminder-${reminder.id}`,
      title: reminder.title,
      detail: reminder.description || reminder.type,
      at: reminder.dueAt,
      source: "reminder" as const,
      href: "/reminders",
    })),
    ...recentLabs.slice(0, 5).map((lab) => ({
      id: `lab-${lab.id}`,
      title: lab.testName,
      detail: `${lab.flag} • ${lab.resultSummary}`,
      at: lab.dateTaken,
      source: "lab" as const,
      href: `/labs?focus=${lab.id}`,
    })),
    ...recentSymptoms.slice(0, 5).map((symptom) => ({
      id: `symptom-${symptom.id}`,
      title: symptom.title,
      detail: `${symptom.severity}${symptom.resolved ? " • resolved" : " • unresolved"}`,
      at: symptom.startedAt,
      source: "symptom" as const,
      href: `/symptoms?focus=${symptom.id}`,
    })),
    ...recentVitals.slice(0, 4).map((vital) => ({
      id: `vital-${vital.id}`,
      title: "Vitals snapshot",
      detail:
        [
          vital.systolic && vital.diastolic
            ? `${vital.systolic}/${vital.diastolic} BP`
            : null,
          vital.heartRate ? `${vital.heartRate} bpm` : null,
          vital.oxygenSaturation ? `${vital.oxygenSaturation}% SpO2` : null,
          vital.bloodSugar ? `${vital.bloodSugar} glucose` : null,
        ]
          .filter(Boolean)
          .join(" • ") || "Vitals recorded",
      at: vital.recordedAt,
      source: "vital" as const,
      href: "/vitals",
    })),
    ...recentDocuments.slice(0, 4).map((document) => ({
      id: `document-${document.id}`,
      title: document.title,
      detail: `${document.type} • ${document.fileName}`,
      at: document.createdAt,
      source: "document" as const,
      href: "/documents",
    })),
  ];

  const timeline: VisitPrepTimelineItem[] = timelineBase
    .map((item) => ({
      ...item,
      bucket: getVisitTimelineBucket(item.at, nextAppointmentAt, now),
      proximityLabel: formatTimelineProximity(item.at, nextAppointmentAt, now),
      actionLabel: getVisitPrepActionLabel(item.source),
    }))
    .sort((a, b) => {
      const anchor = nextAppointmentAt ?? now;
      return (
        Math.abs(a.at.getTime() - anchor.getTime()) -
        Math.abs(b.at.getTime() - anchor.getTime())
      );
    })
    .slice(0, 14);

  return {
    profile,
    nextAppointment,
    nextVisitCountdown: formatVisitCountdown(nextAppointmentAt, now),
    upcomingAppointments,
    activeMedications,
    recentLabs,
    abnormalLabs,
    recentVitals,
    recentSymptoms,
    unresolvedSevereSymptoms,
    recentDocuments,
    unlinkedDocuments,
    doctors,
    dueReminders,
    openAlerts,
    readinessChecks,
    readinessScore,
    readinessSignal,
    tasks: sortedTasks,
    timeline,
    timelineGroups: buildVisitTimelineGroups(timeline),
    summary: {
      criticalTasks: sortedTasks.filter((task) => task.priority === "critical")
        .length,
      highTasks: sortedTasks.filter((task) => task.priority === "high").length,
      abnormalLabs: abnormalLabs.length,
      unresolvedSevereSymptoms: severeSymptoms.length,
      activeMedications: activeMedications.length,
      packetItems:
        activeMedications.length +
        recentLabs.length +
        recentVitals.length +
        recentSymptoms.length +
        recentDocuments.length,
    },
  };
}
