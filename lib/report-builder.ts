import {
  AlertSeverity,
  AlertStatus,
  LabFlag,
  MedicationLogStatus,
  MedicationStatus,
  SymptomSeverity,
} from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export type ReportSectionKey =
  | "profile"
  | "medications"
  | "vitals"
  | "labs"
  | "symptoms"
  | "appointments"
  | "documents"
  | "alerts"
  | "careTeam"
  | "aiInsights"
  | "timeline";

export type ReportType = "patient" | "doctor" | "emergency" | "care" | "custom";

export type ReportBuilderOptions = {
  reportType?: string;
  sections?: string;
  from?: string;
  to?: string;
};

export type ReportSectionDefinition = {
  key: ReportSectionKey;
  label: string;
  description: string;
  recommendedFor: ReportType[];
};

export type ReportActionItem = {
  title: string;
  description: string;
  href: string;
  priority: "high" | "medium" | "low";
};

export type ReportTimelineItem = {
  id: string;
  type: string;
  title: string;
  detail: string;
  occurredAt: Date;
  risk: "urgent" | "watch" | "routine";
};

export const reportSections: ReportSectionDefinition[] = [
  { key: "profile", label: "Profile", description: "Identity, emergency contact, allergies, and baseline context.", recommendedFor: ["patient", "doctor", "emergency", "care", "custom"] },
  { key: "medications", label: "Medications", description: "Active medications, provider links, schedules, and recent adherence.", recommendedFor: ["patient", "doctor", "emergency", "care", "custom"] },
  { key: "vitals", label: "Vitals", description: "Latest vitals and device/manual capture context.", recommendedFor: ["patient", "doctor", "care", "custom"] },
  { key: "labs", label: "Labs", description: "Recent results, abnormal flags, and review context.", recommendedFor: ["patient", "doctor", "care", "custom"] },
  { key: "symptoms", label: "Symptoms", description: "Unresolved symptoms, severity, and notes coverage.", recommendedFor: ["patient", "doctor", "care", "custom"] },
  { key: "appointments", label: "Appointments", description: "Upcoming and recent visit history.", recommendedFor: ["patient", "doctor", "care", "custom"] },
  { key: "documents", label: "Documents", description: "Medical files, linking coverage, and document hygiene.", recommendedFor: ["patient", "doctor", "care", "custom"] },
  { key: "alerts", label: "Alerts", description: "Open alerts, high-risk signals, and follow-up context.", recommendedFor: ["patient", "doctor", "care", "custom"] },
  { key: "careTeam", label: "Care Team", description: "Shared access, caregivers, and active care relationships.", recommendedFor: ["patient", "care", "custom"] },
  { key: "aiInsights", label: "AI Insights", description: "Latest AI summary and source-linked interpretation support.", recommendedFor: ["patient", "doctor", "care", "custom"] },
  { key: "timeline", label: "Timeline", description: "Longitudinal record and care event history.", recommendedFor: ["patient", "doctor", "care", "custom"] },
];

const reportTypeLabels: Record<ReportType, string> = {
  patient: "Patient summary packet",
  doctor: "Doctor visit packet",
  emergency: "Emergency handoff packet",
  care: "Care-team review packet",
  custom: "Custom report packet",
};

function asReportType(value: string | undefined): ReportType {
  if (value === "patient" || value === "doctor" || value === "emergency" || value === "care" || value === "custom") return value;
  return "patient";
}

function parseDate(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function pct(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function defaultSectionsForType(reportType: ReportType): ReportSectionKey[] {
  if (reportType === "emergency") return ["profile", "medications", "vitals", "alerts"];
  if (reportType === "doctor") return ["profile", "medications", "vitals", "labs", "symptoms", "appointments", "documents", "alerts", "aiInsights", "timeline"];
  if (reportType === "care") return ["profile", "medications", "vitals", "labs", "symptoms", "appointments", "documents", "alerts", "careTeam", "aiInsights", "timeline"];
  return ["profile", "medications", "vitals", "labs", "symptoms", "appointments", "documents", "alerts", "timeline"];
}

function parseSections(value: string | undefined, reportType: ReportType): ReportSectionKey[] {
  const allowed = new Set(reportSections.map((section) => section.key));
  const fromQuery = (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is ReportSectionKey => allowed.has(item as ReportSectionKey));

  const selected = fromQuery.length ? fromQuery : defaultSectionsForType(reportType);
  return Array.from(new Set(selected));
}

function dateWhere(field: "createdAt" | "scheduledAt" | "dateTaken" | "recordedAt" | "startedAt", from?: Date, to?: Date) {
  if (!from && !to) return {};
  return {
    [field]: {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    },
  };
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(value);
}

function vitalSummary(vital: {
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null;
  bloodSugar: number | null;
  oxygenSaturation: number | null;
  temperatureC: number | null;
  weightKg: number | null;
}) {
  return [
    vital.systolic && vital.diastolic ? `${vital.systolic}/${vital.diastolic} BP` : null,
    vital.heartRate ? `${vital.heartRate} bpm` : null,
    vital.bloodSugar ? `${vital.bloodSugar} glucose` : null,
    vital.oxygenSaturation ? `${vital.oxygenSaturation}% SpO2` : null,
    vital.temperatureC ? `${vital.temperatureC}°C` : null,
    vital.weightKg ? `${vital.weightKg} kg` : null,
  ].filter(Boolean).join(" • ") || "Vitals captured";
}

export async function getReportBuilderData(options: ReportBuilderOptions = {}) {
  const user = await requireUser();
  const reportType = asReportType(options.reportType);
  const selectedSections = parseSections(options.sections, reportType);
  const from = parseDate(options.from);
  const to = parseDate(options.to);
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    profile,
    medications,
    medicationLogs30d,
    missedMedicationLogs30d,
    appointments,
    labs,
    vitals,
    symptoms,
    documents,
    linkedDocuments,
    alerts,
    highRiskAlerts,
    careAccess,
    aiInsight,
  ] = await Promise.all([
    db.healthProfile.findUnique({ where: { userId: user.id } }),
    db.medication.findMany({
      where: { userId: user.id, status: MedicationStatus.ACTIVE },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        dosage: true,
        frequency: true,
        instructions: true,
        startDate: true,
        endDate: true,
        doctor: { select: { name: true, specialty: true } },
        schedules: { select: { timeOfDay: true }, orderBy: { timeOfDay: "asc" } },
      },
    }),
    db.medicationLog.count({ where: { userId: user.id, loggedAt: { gte: thirtyDaysAgo } } }),
    db.medicationLog.count({ where: { userId: user.id, loggedAt: { gte: thirtyDaysAgo }, status: { in: [MedicationLogStatus.MISSED, MedicationLogStatus.SKIPPED] } } }),
    db.appointment.findMany({
      where: { userId: user.id, ...dateWhere("scheduledAt", from, to) },
      orderBy: { scheduledAt: "desc" },
      take: 8,
      select: { id: true, doctorName: true, clinic: true, purpose: true, scheduledAt: true, status: true, notes: true },
    }),
    db.labResult.findMany({
      where: { userId: user.id, ...dateWhere("dateTaken", from, to) },
      orderBy: { dateTaken: "desc" },
      take: 8,
      select: { id: true, testName: true, resultSummary: true, referenceRange: true, flag: true, dateTaken: true },
    }),
    db.vitalRecord.findMany({
      where: { userId: user.id, ...dateWhere("recordedAt", from, to) },
      orderBy: { recordedAt: "desc" },
      take: 8,
      select: { id: true, recordedAt: true, systolic: true, diastolic: true, heartRate: true, bloodSugar: true, oxygenSaturation: true, temperatureC: true, weightKg: true, readingSource: true },
    }),
    db.symptomEntry.findMany({
      where: { userId: user.id, ...dateWhere("startedAt", from, to) },
      orderBy: { startedAt: "desc" },
      take: 8,
      select: { id: true, title: true, severity: true, bodyArea: true, startedAt: true, resolved: true, notes: true },
    }),
    db.medicalDocument.findMany({
      where: { userId: user.id, ...dateWhere("createdAt", from, to) },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, title: true, type: true, fileName: true, linkedRecordType: true, linkedRecordId: true, createdAt: true },
    }),
    db.medicalDocument.count({ where: { userId: user.id, linkedRecordType: { not: null }, linkedRecordId: { not: null } } }),
    db.alertEvent.findMany({
      where: { userId: user.id, status: AlertStatus.OPEN, ...dateWhere("createdAt", from, to) },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, title: true, message: true, severity: true, category: true, createdAt: true },
    }),
    db.alertEvent.count({ where: { userId: user.id, status: AlertStatus.OPEN, severity: { in: [AlertSeverity.HIGH, AlertSeverity.CRITICAL] } } }),
    db.careAccess.findMany({
      where: { ownerUserId: user.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, accessRole: true, canViewRecords: true, canAddNotes: true, canExport: true, member: { select: { name: true, email: true } } },
    }),
    db.aiInsight.findFirst({
      where: { ownerUserId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, summary: true, adherenceRisk: true, trendFlagsJson: true, suggestedQuestionsJson: true, recommendedFollowUpJson: true, createdAt: true },
    }),
  ]);

  const abnormalLabs = labs.filter((lab) => lab.flag !== LabFlag.NORMAL).length;
  const severeSymptoms = symptoms.filter((symptom) => symptom.severity === SymptomSeverity.SEVERE && !symptom.resolved).length;
  const unresolvedSymptoms = symptoms.filter((symptom) => !symptom.resolved).length;
  const documentLinkRate = pct(linkedDocuments, documents.length);
  const medicationAdherenceRate = medicationLogs30d > 0 ? Math.max(0, 100 - pct(missedMedicationLogs30d, medicationLogs30d)) : 0;
  const profileReady = Boolean(profile?.fullName && profile?.dateOfBirth && profile?.emergencyContactName && profile?.emergencyContactPhone);
  const sectionsScore = pct(selectedSections.length, reportSections.length);
  const dataScore = pct(
    [profileReady, medications.length > 0, vitals.length > 0, labs.length > 0, symptoms.length > 0, documents.length > 0, appointments.length > 0].filter(Boolean).length,
    7,
  );
  const readinessScore = clampScore((sectionsScore * 0.35) + (dataScore * 0.45) + (documentLinkRate * 0.1) + (medicationAdherenceRate * 0.1));

  const actionItems: ReportActionItem[] = [];
  if (!profileReady) {
    actionItems.push({ title: "Complete identity and emergency basics", description: "Report packets are stronger when date of birth, emergency contact, and allergy context are complete.", href: "/onboarding", priority: "high" });
  }
  if (highRiskAlerts > 0) {
    actionItems.push({ title: "Review high-risk alerts before sharing", description: `${highRiskAlerts} high-risk alert${highRiskAlerts === 1 ? "" : "s"} should be reviewed before a report leaves the workspace.`, href: "/alerts", priority: "high" });
  }
  if (abnormalLabs > 0) {
    actionItems.push({ title: "Add lab interpretation context", description: `${abnormalLabs} recent lab result${abnormalLabs === 1 ? "" : "s"} need review notes or follow-up context.`, href: "/lab-review", priority: "medium" });
  }
  if (severeSymptoms > 0) {
    actionItems.push({ title: "Include unresolved severe symptoms", description: `${severeSymptoms} severe unresolved symptom${severeSymptoms === 1 ? "" : "s"} should be included in the provider handoff.`, href: "/symptom-review", priority: "high" });
  }
  if (documents.length > 0 && documentLinkRate < 60) {
    actionItems.push({ title: "Improve document linking", description: `${documentLinkRate}% of recent documents are linked to source records. Link key files before exporting.`, href: "/documents?link=UNLINKED", priority: "medium" });
  }
  if (actionItems.length === 0) {
    actionItems.push({ title: "Report packet is ready for review", description: "Core data, source records, and handoff context look ready for a preview or print packet.", href: "/report-builder/print", priority: "low" });
  }

  const timeline: ReportTimelineItem[] = [
    ...appointments.map((item) => ({ id: `appointment-${item.id}`, type: "Appointment", title: item.purpose, detail: `${item.doctorName} • ${item.clinic}`, occurredAt: item.scheduledAt, risk: item.scheduledAt >= now ? "watch" as const : "routine" as const })),
    ...labs.map((item) => ({ id: `lab-${item.id}`, type: "Lab", title: item.testName, detail: `${item.flag} • ${item.resultSummary}`, occurredAt: item.dateTaken, risk: item.flag === LabFlag.NORMAL ? "routine" as const : "watch" as const })),
    ...vitals.map((item) => ({ id: `vital-${item.id}`, type: "Vital", title: "Vital reading", detail: `${vitalSummary(item)} • ${item.readingSource}`, occurredAt: item.recordedAt, risk: "routine" as const })),
    ...symptoms.map((item) => ({ id: `symptom-${item.id}`, type: "Symptom", title: item.title, detail: `${item.severity}${item.bodyArea ? ` • ${item.bodyArea}` : ""}${item.resolved ? " • resolved" : " • unresolved"}`, occurredAt: item.startedAt, risk: item.severity === SymptomSeverity.SEVERE && !item.resolved ? "urgent" as const : !item.resolved ? "watch" as const : "routine" as const })),
    ...alerts.map((item) => ({ id: `alert-${item.id}`, type: "Alert", title: item.title, detail: `${item.severity} • ${item.message}`, occurredAt: item.createdAt, risk: item.severity === AlertSeverity.CRITICAL || item.severity === AlertSeverity.HIGH ? "urgent" as const : "watch" as const })),
    ...documents.map((item) => ({ id: `document-${item.id}`, type: "Document", title: item.title, detail: `${item.type} • ${item.fileName}`, occurredAt: item.createdAt, risk: item.linkedRecordId ? "routine" as const : "watch" as const })),
  ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()).slice(0, 20);

  return {
    reportType,
    reportTitle: reportTypeLabels[reportType],
    selectedSections,
    sectionDefinitions: reportSections,
    range: {
      from: options.from || "",
      to: options.to || "",
      label: from || to ? `${from ? formatDate(from) : "Beginning"} to ${to ? formatDate(to) : "Today"}` : "All available records",
    },
    summary: {
      readinessScore,
      selectedSectionCount: selectedSections.length,
      availableSectionCount: reportSections.length,
      totalRecords: medications.length + appointments.length + labs.length + vitals.length + symptoms.length + documents.length + alerts.length,
      highRiskAlerts,
      abnormalLabs,
      unresolvedSymptoms,
      documentLinkRate,
      medicationAdherenceRate,
    },
    profile,
    medications,
    appointments,
    labs,
    vitals,
    symptoms,
    documents,
    alerts,
    careAccess,
    aiInsight,
    actionItems,
    timeline,
  };
}

export function sectionQuery(sections: ReportSectionKey[]) {
  return sections.join(",");
}

export function isSectionSelected(sections: ReportSectionKey[], key: ReportSectionKey) {
  return sections.includes(key);
}
