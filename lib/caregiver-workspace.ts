import type { AlertSeverity, AlertStatus, CareAccessRole, LabFlag, ReminderState, SymptomSeverity } from "@prisma/client";

import { db } from "@/lib/db";

export type CaregiverPermission = {
  label: string;
  enabled: boolean;
  description: string;
};

export type CaregiverWorkspaceData = Awaited<ReturnType<typeof getCaregiverWorkspaceData>>;

export function formatCareDate(value: Date | null | undefined, withTime = false) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(value);
}

function fullNameFallback(args: { fullName?: string | null; name?: string | null; email?: string | null }) {
  return args.fullName || args.name || args.email || "Patient";
}

function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";
}

function ageFromDob(dateOfBirth: Date | null | undefined) {
  if (!dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDelta = today.getMonth() - dateOfBirth.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function permissionMatrix(access: {
  accessRole: CareAccessRole | "OWNER";
  canViewRecords: boolean;
  canEditRecords: boolean;
  canAddNotes: boolean;
  canExport: boolean;
  canGenerateAIInsights: boolean;
}): CaregiverPermission[] {
  return [
    {
      label: "View records",
      enabled: access.canViewRecords,
      description: "Can review shared profile, records, alerts, and care context.",
    },
    {
      label: "Edit records",
      enabled: access.canEditRecords,
      description: "Can update shared patient records where product flows allow edits.",
    },
    {
      label: "Add notes",
      enabled: access.canAddNotes,
      description: "Can contribute care context and follow-up notes in supported workflows.",
    },
    {
      label: "Export data",
      enabled: access.canExport,
      description: "Can prepare printable or downloadable care handoff packets.",
    },
    {
      label: "Generate AI insights",
      enabled: access.canGenerateAIInsights,
      description: "Can request AI-assisted summaries for the shared patient record.",
    },
  ];
}

function severityScore(severity: AlertSeverity | SymptomSeverity | LabFlag | ReminderState | AlertStatus | string) {
  const normalized = String(severity).toUpperCase();
  if (["CRITICAL", "HIGH", "SEVERE", "OVERDUE", "OPEN"].includes(normalized)) return 3;
  if (["MEDIUM", "MODERATE", "BORDERLINE", "LOW", "MISSED", "DUE", "ACKNOWLEDGED"].includes(normalized)) return 2;
  return 1;
}

function isAttentionLab(flag: LabFlag) {
  return flag === "BORDERLINE" || flag === "HIGH" || flag === "LOW";
}

function isAttentionReminder(state: ReminderState) {
  return state === "DUE" || state === "OVERDUE" || state === "MISSED";
}

export async function getCaregiverWorkspaceData(params: {
  ownerUserId: string;
  access: {
    accessRole: CareAccessRole | "OWNER";
    isOwner?: boolean;
    canViewRecords: boolean;
    canEditRecords: boolean;
    canAddNotes: boolean;
    canExport: boolean;
    canGenerateAIInsights: boolean;
  };
}) {
  const now = new Date();
  const soon = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14);

  const [
    owner,
    medications,
    appointments,
    labs,
    vitals,
    symptoms,
    reminders,
    alerts,
    documents,
    latestInsight,
    careTeam,
    careNotes,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: params.ownerUserId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        healthProfile: true,
      },
    }),
    db.medication.findMany({
      where: { userId: params.ownerUserId },
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
      include: { schedules: true, doctor: true },
      take: 8,
    }),
    db.appointment.findMany({
      where: { userId: params.ownerUserId },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    }),
    db.labResult.findMany({
      where: { userId: params.ownerUserId },
      orderBy: { dateTaken: "desc" },
      take: 8,
    }),
    db.vitalRecord.findMany({
      where: { userId: params.ownerUserId },
      orderBy: { recordedAt: "desc" },
      take: 8,
    }),
    db.symptomEntry.findMany({
      where: { userId: params.ownerUserId },
      orderBy: { startedAt: "desc" },
      take: 8,
    }),
    db.reminder.findMany({
      where: {
        userId: params.ownerUserId,
        dueAt: { lte: soon },
      },
      orderBy: { dueAt: "asc" },
      take: 8,
    }),
    db.alertEvent.findMany({
      where: {
        userId: params.ownerUserId,
        visibleToCareTeam: true,
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 8,
    }),
    db.medicalDocument.findMany({
      where: { userId: params.ownerUserId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.aiInsight.findFirst({
      where: { ownerUserId: params.ownerUserId },
      orderBy: { createdAt: "desc" },
    }),
    db.careAccess.findMany({
      where: {
        ownerUserId: params.ownerUserId,
        status: "ACTIVE",
      },
      include: {
        member: {
          select: { name: true, email: true, role: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    db.careNote.findMany({
      where: {
        ownerUserId: params.ownerUserId,
        archivedAt: null,
        visibility: params.access.isOwner ? undefined : { in: ["CARE_TEAM", "PROVIDERS"] },
      },
      include: {
        author: { select: { name: true, email: true, role: true } },
      },
      orderBy: [{ pinned: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
  ]);

  if (!owner) {
    throw new Error("Patient not found.");
  }

  const displayName = fullNameFallback({
    fullName: owner.healthProfile?.fullName,
    name: owner.name,
    email: owner.email,
  });

  const activeMedications = medications.filter((item) => item.active);
  const upcomingAppointments = appointments.filter((item) => item.scheduledAt >= now);
  const openAlerts = alerts.filter((item) => item.status === "OPEN");
  const attentionLabs = labs.filter((item) => isAttentionLab(item.flag));
  const unresolvedSymptoms = symptoms.filter((item) => !item.resolved);
  const dueReminders = reminders.filter((item) => isAttentionReminder(item.state) && !item.completed);

  const attentionItems = [
    ...openAlerts.map((item) => ({
      key: `alert-${item.id}`,
      title: item.title,
      detail: item.message,
      meta: `${item.severity} · ${item.category}`,
      score: severityScore(item.severity) + severityScore(item.status),
      href: `/alerts/${item.id}`,
      type: "Alert",
    })),
    ...attentionLabs.map((item) => ({
      key: `lab-${item.id}`,
      title: item.testName,
      detail: item.resultSummary,
      meta: `${item.flag} · ${formatCareDate(item.dateTaken)}`,
      score: severityScore(item.flag),
      href: "/labs",
      type: "Lab",
    })),
    ...unresolvedSymptoms.map((item) => ({
      key: `symptom-${item.id}`,
      title: item.title,
      detail: item.notes || item.bodyArea || "Unresolved symptom entry.",
      meta: `${item.severity} · ${formatCareDate(item.startedAt)}`,
      score: severityScore(item.severity),
      href: "/symptoms",
      type: "Symptom",
    })),
    ...dueReminders.map((item) => ({
      key: `reminder-${item.id}`,
      title: item.title,
      detail: item.description || "Reminder needs follow-up.",
      meta: `${item.state} · ${formatCareDate(item.dueAt, true)}`,
      score: severityScore(item.state),
      href: "/reminders",
      type: "Reminder",
    })),
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const timeline = [
    ...upcomingAppointments.map((item) => ({
      key: `appointment-${item.id}`,
      title: item.purpose,
      detail: `${item.doctorName} · ${item.clinic}`,
      at: item.scheduledAt,
      kind: "Appointment",
      href: "/appointments",
    })),
    ...reminders.map((item) => ({
      key: `reminder-${item.id}`,
      title: item.title,
      detail: item.description || `${item.type} reminder`,
      at: item.dueAt,
      kind: "Reminder",
      href: "/reminders",
    })),
    ...labs.slice(0, 4).map((item) => ({
      key: `lab-${item.id}`,
      title: item.testName,
      detail: `${item.flag} · ${item.resultSummary}`,
      at: item.dateTaken,
      kind: "Lab",
      href: "/labs",
    })),
  ]
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, 10);

  const recentRecords = [
    ...vitals.map((item) => ({
      key: `vital-${item.id}`,
      title: "Vital reading",
      detail: [
        item.systolic || item.diastolic ? `BP ${item.systolic ?? "—"}/${item.diastolic ?? "—"}` : null,
        item.heartRate ? `HR ${item.heartRate}` : null,
        item.oxygenSaturation ? `SpO2 ${item.oxygenSaturation}%` : null,
        item.temperatureC ? `${item.temperatureC}°C` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "Manual vital entry",
      at: item.recordedAt,
      kind: "Vitals",
      href: "/vitals",
    })),
    ...symptoms.map((item) => ({
      key: `symptom-${item.id}`,
      title: item.title,
      detail: `${item.severity}${item.resolved ? " · Resolved" : " · Active"}`,
      at: item.startedAt,
      kind: "Symptoms",
      href: "/symptoms",
    })),
    ...documents.map((item) => ({
      key: `document-${item.id}`,
      title: item.title,
      detail: `${item.type} · ${item.fileName}`,
      at: item.createdAt,
      kind: "Document",
      href: `/api/documents/${item.id}/download`,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 10);

  return {
    owner,
    displayName,
    initials: initials(displayName),
    age: ageFromDob(owner.healthProfile?.dateOfBirth),
    permissions: permissionMatrix(params.access),
    metrics: {
      activeMedications: activeMedications.length,
      upcomingAppointments: upcomingAppointments.length,
      openAlerts: openAlerts.length,
      dueReminders: dueReminders.length,
      attentionLabs: attentionLabs.length,
      unresolvedSymptoms: unresolvedSymptoms.length,
      documents: documents.length,
      careMembers: careTeam.length,
      careNotes: careNotes.length,
    },
    medications,
    appointments: upcomingAppointments.slice(0, 5),
    labs,
    vitals,
    symptoms,
    reminders,
    alerts,
    documents,
    latestInsight,
    careNotes,
    careTeam,
    attentionItems,
    timeline,
    recentRecords,
  };
}
