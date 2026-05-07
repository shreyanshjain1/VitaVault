import { AlertSeverity, AlertStatus, CareNotePriority, LabFlag, MedicationLogStatus, ReminderState } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { exportDefinitions } from "@/lib/export-definitions";

export type ExportPacket = {
  title: string;
  description: string;
  href: string;
  format: "Print / PDF" | "Workspace";
  readiness: "Ready" | "Review first" | "Setup needed";
  reason: string;
};

export type ExportActionItem = {
  title: string;
  description: string;
  href: string;
  priority: "high" | "medium" | "low";
};

function pct(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function scoreFromChecks(checks: boolean[]) {
  if (!checks.length) return 0;
  return pct(checks.filter(Boolean).length, checks.length);
}

type CareNoteCountDelegate = {
  count: (args: { where: Record<string, unknown> }) => Promise<number>;
};

function getOptionalCareNoteDelegate() {
  return (db as typeof db & { careNote?: CareNoteCountDelegate }).careNote;
}

export async function getExportCenterData() {
  const user = await requireUser();
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    profile,
    medications,
    medicationLogs30d,
    missedMedicationLogs30d,
    appointments,
    upcomingAppointments,
    labs,
    abnormalLabs,
    vitals,
    symptoms,
    severeOpenSymptoms,
    vaccinations,
    documents,
    linkedDocuments,
    reminders,
    activeReminders,
    openAlerts,
    highRiskAlerts,
    doctors,
  ] = await Promise.all([
    db.healthProfile.findUnique({ where: { userId: user.id } }),
    db.medication.count({ where: { userId: user.id } }),
    db.medicationLog.count({ where: { userId: user.id, loggedAt: { gte: thirtyDaysAgo } } }),
    db.medicationLog.count({ where: { userId: user.id, loggedAt: { gte: thirtyDaysAgo }, status: { in: [MedicationLogStatus.MISSED, MedicationLogStatus.SKIPPED] } } }),
    db.appointment.count({ where: { userId: user.id } }),
    db.appointment.count({ where: { userId: user.id, scheduledAt: { gte: now } } }),
    db.labResult.count({ where: { userId: user.id } }),
    db.labResult.count({ where: { userId: user.id, flag: { in: [LabFlag.BORDERLINE, LabFlag.HIGH, LabFlag.LOW] } } }),
    db.vitalRecord.count({ where: { userId: user.id } }),
    db.symptomEntry.count({ where: { userId: user.id } }),
    db.symptomEntry.count({ where: { userId: user.id, severity: "SEVERE", resolved: false } }),
    db.vaccinationRecord.count({ where: { userId: user.id } }),
    db.medicalDocument.count({ where: { userId: user.id } }),
    db.medicalDocument.count({ where: { userId: user.id, linkedRecordType: { not: null }, linkedRecordId: { not: null } } }),
    db.reminder.count({ where: { userId: user.id } }),
    db.reminder.count({ where: { userId: user.id, state: { in: [ReminderState.DUE, ReminderState.OVERDUE, ReminderState.MISSED] } } }),
    db.alertEvent.count({ where: { userId: user.id, status: AlertStatus.OPEN } }),
    db.alertEvent.count({ where: { userId: user.id, status: AlertStatus.OPEN, severity: { in: [AlertSeverity.HIGH, AlertSeverity.CRITICAL] } } }),
    db.doctor.count({ where: { userId: user.id } }),
  ]);

  const careNoteDelegate = getOptionalCareNoteDelegate();
  const [careNotes, urgentCareNotes] = careNoteDelegate
    ? await Promise.all([
        careNoteDelegate.count({ where: { ownerUserId: user.id, archivedAt: null } }),
        careNoteDelegate.count({ where: { ownerUserId: user.id, archivedAt: null, priority: { in: [CareNotePriority.HIGH, CareNotePriority.URGENT] } } }),
      ])
    : [0, 0];

  const profileReady = Boolean(profile?.fullName && profile?.dateOfBirth && profile?.emergencyContactName && profile?.emergencyContactPhone);
  const medicationReady = medications > 0;
  const clinicalReady = labs > 0 || vitals > 0 || symptoms > 0;
  const documentReady = documents > 0;
  const providerReady = doctors > 0 || appointments > 0;
  const readinessScore = scoreFromChecks([profileReady, medicationReady, clinicalReady, documentReady, providerReady]);
  const documentLinkRate = pct(linkedDocuments, documents);
  const medicationAdherenceRate = medicationLogs30d > 0 ? Math.max(0, 100 - pct(missedMedicationLogs30d, medicationLogs30d)) : 0;

  const csvCoverage = [
    { label: "Core records", value: appointments + medications + labs + vaccinations, description: "Appointments, medications, lab results, and vaccination records." },
    { label: "Monitoring data", value: vitals + symptoms, description: "Vitals and symptom history for trends and review." },
    { label: "Coordination", value: reminders + documents + openAlerts + careNotes, description: "Reminders, documents, alert snapshots, and care notes." },
  ];

  const packets: ExportPacket[] = [
    {
      title: "Patient summary packet",
      description: "A broad handoff report for patient profile, recent records, reminders, and risk context.",
      href: "/summary/print?mode=compact",
      format: "Print / PDF",
      readiness: profileReady ? "Ready" : "Review first",
      reason: profileReady ? "Profile and emergency basics are available." : "Add profile and emergency contact details before sharing.",
    },
    {
      title: "Doctor visit packet",
      description: "A provider-focused report for upcoming visits and clinical handoff preparation.",
      href: "/summary/print?mode=doctor",
      format: "Print / PDF",
      readiness: upcomingAppointments > 0 || providerReady ? "Ready" : "Setup needed",
      reason: upcomingAppointments > 0 ? "Upcoming appointment context is available." : "Add an appointment or provider to make this stronger.",
    },
    {
      title: "Emergency health card",
      description: "A compact printable card for emergency contact, allergies, conditions, medications, and latest vitals.",
      href: "/emergency-card/print",
      format: "Print / PDF",
      readiness: profile?.emergencyContactName && profile?.emergencyContactPhone ? "Ready" : "Review first",
      reason: profile?.emergencyContactName && profile?.emergencyContactPhone ? "Emergency contact details are present." : "Emergency contact details are missing.",
    },
    {
      title: "Care plan review workspace",
      description: "A workflow view for current care gaps, action items, upcoming care, and provider context.",
      href: "/care-plan",
      format: "Workspace",
      readiness: readinessScore >= 60 ? "Ready" : "Review first",
      reason: `${readinessScore}% export readiness across profile, records, documents, and provider context.`,
    },
  ];

  if (careNoteDelegate) {
    packets.push({
      title: "Care-team notes packet",
      description: "A collaboration-focused report builder preset that includes care notes, timeline context, and shared access details.",
      href: "/report-builder?preset=care-team-weekly",
      format: "Workspace",
      readiness: careNotes > 0 ? "Ready" : "Setup needed",
      reason: careNotes > 0 ? `${careNotes} active care note${careNotes === 1 ? "" : "s"} available for handoff context.` : "Add a care note before preparing a collaboration packet.",
    });
  }

  const actionItems: ExportActionItem[] = [];

  if (!profileReady) {
    actionItems.push({
      title: "Complete profile and emergency details",
      description: "Patient summary and emergency reports are more useful when identity, date of birth, and emergency contact fields are complete.",
      href: "/onboarding",
      priority: "high",
    });
  }

  if (documents > 0 && documentLinkRate < 60) {
    actionItems.push({
      title: "Improve document link coverage",
      description: `${documentLinkRate}% of documents are linked to a record. Link lab files, prescriptions, and discharge documents before exporting.`,
      href: "/documents?link=UNLINKED",
      priority: "medium",
    });
  }

  if (highRiskAlerts > 0) {
    actionItems.push({
      title: "Review high-risk open alerts",
      description: `${highRiskAlerts} high-priority alert${highRiskAlerts === 1 ? "" : "s"} should be reviewed before sending a handoff packet.`,
      href: "/alerts",
      priority: "high",
    });
  }

  if (abnormalLabs > 0) {
    actionItems.push({
      title: "Add lab review context",
      description: `${abnormalLabs} lab result${abnormalLabs === 1 ? "" : "s"} are abnormal or borderline. Review them before a doctor packet.`,
      href: "/lab-review",
      priority: "medium",
    });
  }

  if (urgentCareNotes > 0) {
    actionItems.push({
      title: "Review care-team notes",
      description: `${urgentCareNotes} high-priority care note${urgentCareNotes === 1 ? "" : "s"} should be reviewed before exporting a handoff packet.`,
      href: "/care-notes",
      priority: "medium",
    });
  }

  if (severeOpenSymptoms > 0) {
    actionItems.push({
      title: "Review severe unresolved symptoms",
      description: `${severeOpenSymptoms} severe symptom${severeOpenSymptoms === 1 ? "" : "s"} remain unresolved and should be included in visit prep.`,
      href: "/symptom-review",
      priority: "high",
    });
  }

  if (actionItems.length === 0) {
    actionItems.push({
      title: "Export readiness looks healthy",
      description: "Core profile, records, and reporting context look ready for handoff and review workflows.",
      href: "/summary",
      priority: "low",
    });
  }

  return {
    summary: {
      readinessScore,
      csvExportTypes: exportDefinitions.length,
      reportPackets: packets.length,
      totalRecords: medications + appointments + labs + vitals + symptoms + vaccinations + documents + reminders + openAlerts + careNotes,
      documentLinkRate,
      medicationAdherenceRate,
      activeReminders,
      openAlerts,
      highRiskAlerts,
      careNotes,
      urgentCareNotes,
    },
    csvCoverage,
    packets,
    actionItems,
  };
}
