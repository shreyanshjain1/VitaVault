import { addDays, format, subDays } from "date-fns";
import {
  AlertStatus,
  AppointmentStatus,
  LabFlag,
  MedicationStatus,
  ReminderState,
  SymptomSeverity,
} from "@prisma/client";
import { db } from "@/lib/db";

type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

function isFilled(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function formatShortDate(value: Date) {
  return format(value, "MMM d");
}

function formatShortDateTime(value: Date) {
  return format(value, "MMM d, h:mm a");
}

function daysSince(value: Date | null | undefined) {
  if (!value) return null;
  const diff = Date.now() - value.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function freshnessLabel(value: Date | null | undefined) {
  if (!value) return "No data yet";
  const days = daysSince(value);
  if (days === null) return "No data yet";
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  return `Updated ${days} days ago`;
}

function freshnessTone(value: Date | null | undefined): StatusTone {
  if (!value) return "neutral";
  const days = daysSince(value);
  if (days === null) return "neutral";
  if (days <= 7) return "success";
  if (days <= 30) return "info";
  return "warning";
}

export async function getDashboardData(userId: string) {
  const now = new Date();

  const [
    profile,
    medications,
    appointments,
    labs,
    vitals,
    symptoms,
    reminders,
    medicationLogs,
    reviewQueueReminders,
    severeSymptoms,
    abnormalLabs,
    openAlerts,
    documents,
    careAccesses,
    careInvites,
    aiInsights,
  ] = await Promise.all([
    db.healthProfile.findUnique({ where: { userId } }),
    db.medication.findMany({
      where: { userId },
      include: { schedules: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.appointment.findMany({
      where: {
        userId,
        scheduledAt: { gte: subDays(now, 1) },
        status: { not: AppointmentStatus.CANCELLED },
      },
      orderBy: { scheduledAt: "asc" },
      take: 6,
    }),
    db.labResult.findMany({
      where: { userId },
      orderBy: { dateTaken: "desc" },
      take: 8,
    }),
    db.vitalRecord.findMany({
      where: { userId },
      orderBy: { recordedAt: "desc" },
      take: 20,
    }),
    db.symptomEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.reminder.findMany({
      where: {
        userId,
        state: {
          in: [ReminderState.DUE, ReminderState.SENT, ReminderState.OVERDUE],
        },
        dueAt: { lte: addDays(now, 14) },
      },
      orderBy: { dueAt: "asc" },
      take: 8,
    }),
    db.medicationLog.findMany({
      where: {
        userId,
        loggedAt: {
          gte: subDays(now, 7),
        },
      },
      include: { medication: true },
      orderBy: { loggedAt: "desc" },
      take: 20,
    }),
    db.reminder.findMany({
      where: {
        userId,
        state: {
          in: [ReminderState.OVERDUE, ReminderState.MISSED],
        },
      },
      orderBy: { dueAt: "asc" },
      take: 20,
    }),
    db.symptomEntry.findMany({
      where: {
        userId,
        severity: SymptomSeverity.SEVERE,
        resolved: false,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.labResult.findMany({
      where: {
        userId,
        flag: {
          in: [LabFlag.HIGH, LabFlag.LOW, LabFlag.BORDERLINE],
        },
      },
      orderBy: { dateTaken: "desc" },
      take: 8,
    }),
    db.alertEvent.findMany({
      where: {
        userId,
        status: AlertStatus.OPEN,
      },
      include: { rule: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.medicalDocument.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.careAccess.findMany({
      where: { ownerUserId: userId },
      include: { member: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    db.careInvite.findMany({
      where: { ownerUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.aiInsight.findMany({
      where: { ownerUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const adherenceByDay = Array.from({ length: 7 }).map((_, index) => {
    const date = subDays(now, 6 - index);
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

  const bloodPressureTrend = vitals
    .filter((v) => v.systolic != null && v.diastolic != null)
    .slice()
    .reverse()
    .map((v) => ({
      label: format(v.recordedAt, "MMM d"),
      systolic: v.systolic ?? 0,
      diastolic: v.diastolic ?? 0,
    }));

  const weightTrend = vitals
    .filter((v) => v.weightKg != null)
    .slice()
    .reverse()
    .map((v) => ({
      label: format(v.recordedAt, "MMM d"),
      value: v.weightKg ?? 0,
    }));

  const sugarTrend = vitals
    .filter((v) => v.bloodSugar != null)
    .slice()
    .reverse()
    .map((v) => ({
      label: format(v.recordedAt, "MMM d"),
      value: v.bloodSugar ?? 0,
    }));

  const activeMedications = medications.filter(
    (medication) => medication.status === MedicationStatus.ACTIVE || medication.active
  );
  const nextMedication = activeMedications[0] ?? medications[0] ?? null;

  const profileChecklist = [
    {
      key: "identity",
      label: "Identity basics",
      href: "/health-profile",
      complete: isFilled(profile?.fullName) && isFilled(profile?.dateOfBirth) && isFilled(profile?.sex),
    },
    {
      key: "clinical-baseline",
      label: "Clinical baseline",
      href: "/health-profile",
      complete: isFilled(profile?.bloodType) && isFilled(profile?.heightCm) && isFilled(profile?.weightKg),
    },
    {
      key: "emergency-contact",
      label: "Emergency contact",
      href: "/health-profile",
      complete: isFilled(profile?.emergencyContactName) && isFilled(profile?.emergencyContactPhone),
    },
    {
      key: "allergies-conditions",
      label: "Allergies & conditions",
      href: "/health-profile",
      complete: isFilled(profile?.allergiesSummary) && isFilled(profile?.chronicConditions),
    },
    {
      key: "active-medications",
      label: "Active medications",
      href: "/medications",
      complete: activeMedications.length > 0,
    },
    {
      key: "recent-vitals",
      label: "Recent vitals",
      href: "/vitals",
      complete: vitals.length > 0,
    },
    {
      key: "care-network",
      label: "Care network",
      href: "/care-team",
      complete: careAccesses.length > 0 || careInvites.length > 0,
    },
    {
      key: "documents",
      label: "Health documents",
      href: "/documents",
      complete: documents.length > 0,
    },
  ];

  const profileCompletion = Math.round(
    (profileChecklist.filter((item) => item.complete).length / profileChecklist.length) * 100
  );

  const reviewQueueSummary = {
    overdueReminders: reviewQueueReminders.filter((item) => item.state === ReminderState.OVERDUE)
      .length,
    missedReminders: reviewQueueReminders.filter((item) => item.state === ReminderState.MISSED)
      .length,
    severeSymptoms: severeSymptoms.length,
    abnormalLabs: abnormalLabs.length,
    total: reviewQueueReminders.length + severeSymptoms.length + abnormalLabs.length + openAlerts.length,
  };

  const needsAttention = [
    ...openAlerts.slice(0, 3).map((alert) => ({
      key: `alert-${alert.id}`,
      title: alert.title,
      body: alert.message,
      detail: alert.rule?.name ? `Rule: ${alert.rule.name}` : "Alert event",
      tone: alert.severity === "CRITICAL" || alert.severity === "HIGH" ? "danger" : "warning",
      href: `/alerts/${alert.id}`,
    })),
    ...reviewQueueReminders.slice(0, 2).map((reminder) => ({
      key: `reminder-${reminder.id}`,
      title: reminder.title,
      body: reminder.description ?? "Reminder needs follow-up.",
      detail: `${reminder.state} • ${formatShortDateTime(reminder.dueAt)}`,
      tone: reminder.state === ReminderState.MISSED ? "danger" : "warning",
      href: "/review-queue",
    })),
    ...abnormalLabs.slice(0, 2).map((lab) => ({
      key: `lab-${lab.id}`,
      title: lab.testName,
      body: lab.resultSummary,
      detail: `${lab.flag} • ${formatShortDate(lab.dateTaken)}`,
      tone: lab.flag === LabFlag.BORDERLINE ? "warning" : "danger",
      href: "/labs",
    })),
    ...severeSymptoms.slice(0, 2).map((symptom) => ({
      key: `symptom-${symptom.id}`,
      title: symptom.title,
      body: symptom.notes ?? "Severe symptom is still unresolved.",
      detail: `Logged ${formatShortDate(symptom.createdAt)}`,
      tone: "danger",
      href: "/symptoms",
    })),
    ...(profileCompletion < 70
      ? [
          {
            key: "profile-completion",
            title: "Complete your health profile",
            body: "More baseline information improves summaries, alerts, and emergency-readiness.",
            detail: `${profileCompletion}% complete`,
            tone: "info" as StatusTone,
            href: "/health-profile",
          },
        ]
      : []),
  ].slice(0, 6) as Array<{
    key: string;
    title: string;
    body: string;
    detail: string;
    tone: StatusTone;
    href: string;
  }>;

  const careTimeline = [
    ...reminders.map((reminder) => ({
      key: `reminder-${reminder.id}`,
      at: reminder.dueAt,
      title: reminder.title,
      type: "Reminder",
      body: reminder.description ?? `${reminder.type} reminder`,
      href: "/reminders",
      tone: (reminder.state === ReminderState.OVERDUE ? "warning" : "info") as StatusTone,
    })),
    ...appointments.map((appointment) => ({
      key: `appointment-${appointment.id}`,
      at: appointment.scheduledAt,
      title: appointment.purpose,
      type: "Visit",
      body: `${appointment.doctorName} • ${appointment.clinic}`,
      href: "/appointments",
      tone: "success" as StatusTone,
    })),
  ]
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, 6);

  const recentActivity = [
    ...medicationLogs.slice(0, 4).map((log) => ({
      key: `med-log-${log.id}`,
      at: log.loggedAt,
      title: `${log.medication.name} marked ${log.status.toLowerCase()}`,
      body: log.notes ?? log.scheduleTime ?? "Medication adherence log",
      href: "/medications",
      type: "Medication",
    })),
    ...vitals.slice(0, 4).map((vital) => ({
      key: `vital-${vital.id}`,
      at: vital.recordedAt,
      title: "Vitals recorded",
      body: `BP ${vital.systolic ?? "—"}/${vital.diastolic ?? "—"} • HR ${vital.heartRate ?? "—"}`,
      href: "/vitals",
      type: "Vitals",
    })),
    ...labs.slice(0, 4).map((lab) => ({
      key: `lab-${lab.id}`,
      at: lab.dateTaken,
      title: lab.testName,
      body: `${lab.flag} • ${lab.resultSummary}`,
      href: "/labs",
      type: "Lab",
    })),
    ...symptoms.slice(0, 4).map((symptom) => ({
      key: `symptom-${symptom.id}`,
      at: symptom.createdAt,
      title: symptom.title,
      body: `${symptom.severity}${symptom.resolved ? " • Resolved" : " • Active"}`,
      href: "/symptoms",
      type: "Symptom",
    })),
    ...documents.slice(0, 3).map((document) => ({
      key: `document-${document.id}`,
      at: document.createdAt,
      title: document.title,
      body: `${document.type} • ${document.fileName}`,
      href: "/documents",
      type: "Document",
    })),
    ...aiInsights.slice(0, 2).map((insight) => ({
      key: `ai-${insight.id}`,
      at: insight.createdAt,
      title: insight.title,
      body: insight.adherenceRisk,
      href: "/ai-insights",
      type: "AI Insight",
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  const latestVitalsAt = vitals[0]?.recordedAt ?? null;
  const latestLabAt = labs[0]?.dateTaken ?? null;
  const latestSymptomAt = symptoms[0]?.createdAt ?? null;
  const latestDocumentAt = documents[0]?.createdAt ?? null;

  const dataFreshness = [
    {
      key: "vitals",
      label: "Vitals",
      href: "/vitals",
      value: freshnessLabel(latestVitalsAt),
      tone: freshnessTone(latestVitalsAt),
    },
    {
      key: "labs",
      label: "Labs",
      href: "/labs",
      value: freshnessLabel(latestLabAt),
      tone: freshnessTone(latestLabAt),
    },
    {
      key: "symptoms",
      label: "Symptoms",
      href: "/symptoms",
      value: freshnessLabel(latestSymptomAt),
      tone: freshnessTone(latestSymptomAt),
    },
    {
      key: "documents",
      label: "Documents",
      href: "/documents",
      value: freshnessLabel(latestDocumentAt),
      tone: freshnessTone(latestDocumentAt),
    },
  ];

  const readinessLevel =
    profileCompletion >= 85 && reviewQueueSummary.total === 0
      ? "Ready"
      : profileCompletion >= 60
        ? "In progress"
        : "Needs setup";

  const quickActions = [
    { href: "/vitals", label: "Add vitals", description: "Log BP, sugar, HR, weight, and oxygen." },
    { href: "/medications", label: "Update meds", description: "Manage active medication plans and logs." },
    { href: "/documents", label: "Upload document", description: "Store labs, prescriptions, and scans." },
    { href: "/reminders", label: "Create reminder", description: "Schedule medication, lab, or follow-up tasks." },
    { href: "/care-team", label: "Invite care team", description: "Share access with caregivers or doctors." },
    { href: "/summary/print", label: "Print summary", description: "Prepare a clean health summary for visits." },
  ];

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
    openAlerts,
    nextMedication,
    profileCompletion,
    profileChecklist,
    bloodPressureTrend,
    weightTrend,
    sugarTrend,
    reviewQueueSummary,
    needsAttention,
    careTimeline,
    recentActivity,
    dataFreshness,
    quickActions,
    readinessLevel,
  };
}
