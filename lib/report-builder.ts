import {
  AlertSeverity,
  AlertStatus,
  LabFlag,
  MedicationLogStatus,
  MedicationStatus,
  SymptomSeverity,
} from "@prisma/client";
import { db } from "@/lib/db";
import { careNotePreShareStatus, careNoteWorkflowRisk, summarizeCareNoteForWorkflow } from "@/lib/care-note-workflows";
import {
  buildReportPrintHref,
  getReportBuilderPreset,
  reportBuilderPresets,
  resolveReportBuilderControls,
  sectionQuery,
  type ReportSectionKey,
  type ReportType,
} from "@/lib/report-builder-presets";
import { requireUser } from "@/lib/session";
import { mapSavedReportToHistoryItem, summarizeSavedReportStats } from "@/lib/report-history";

export { buildReportBuilderHref, buildReportPrintHref, reportBuilderPresets, sectionQuery } from "@/lib/report-builder-presets";
export type { ReportPresetDefinition, ReportPresetId, ReportSectionKey, ReportType } from "@/lib/report-builder-presets";

export type ReportBuilderOptions = {
  preset?: string;
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

export type ReportHistoryItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  generatedAt: Date;
  status: "ready" | "review" | "attention";
  recordCount: number;
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
  { key: "careNotes", label: "Care Notes", description: "Pinned, high-priority, and recent collaboration notes for handoffs.", recommendedFor: ["patient", "doctor", "care", "custom"] },
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
  if (reportType === "doctor") return ["profile", "medications", "vitals", "labs", "symptoms", "appointments", "documents", "alerts", "careNotes", "aiInsights", "timeline"];
  if (reportType === "care") return ["profile", "medications", "vitals", "labs", "symptoms", "appointments", "documents", "alerts", "careTeam", "careNotes", "aiInsights", "timeline"];
  return ["profile", "medications", "vitals", "labs", "symptoms", "appointments", "documents", "alerts", "careNotes", "timeline"];
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
  const now = new Date();
  const controls = resolveReportBuilderControls(
    { preset: options.preset, reportType: options.reportType, sections: options.sections, from: options.from, to: options.to },
    now,
  );
  const reportType = controls.reportType;
  const selectedSections = parseSections(controls.sections, reportType);
  const from = parseDate(controls.from);
  const to = parseDate(controls.to);
  const selectedPreset = getReportBuilderPreset(controls.presetId);
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
    careNotes,
    savedReports,
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
    db.careNote.findMany({
      where: { ownerUserId: user.id, archivedAt: null, ...dateWhere("createdAt", from, to) },
      orderBy: [{ pinned: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
      take: 8,
      include: { author: { select: { name: true, email: true, role: true } } },
    }),
    db.savedReport.findMany({
      where: { userId: user.id, archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        description: true,
        reportType: true,
        presetId: true,
        sectionsJson: true,
        fromDate: true,
        toDate: true,
        status: true,
        readinessScore: true,
        recordCount: true,
        packetHref: true,
        printHref: true,
        createdAt: true,
        updatedAt: true,
      },
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
    [profileReady, medications.length > 0, vitals.length > 0, labs.length > 0, symptoms.length > 0, documents.length > 0, appointments.length > 0, careNotes.length > 0].filter(Boolean).length,
    8,
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

  const careNoteStatus = careNotePreShareStatus(careNotes);
  if (careNotes.length > 0 && careNoteStatus.priority !== "low") {
    actionItems.push({
      title: careNoteStatus.title,
      description: careNoteStatus.description,
      href: "/care-notes",
      priority: careNoteStatus.priority,
    });
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
    ...careNotes.map((item) => ({
      id: `care-note-${item.id}`,
      type: "Care note",
      title: item.title,
      detail: summarizeCareNoteForWorkflow({
        title: item.title,
        body: item.body,
        category: item.category,
        priority: item.priority,
        visibility: item.visibility,
        pinned: item.pinned,
        authorName: item.author.name || item.author.email,
      }),
      occurredAt: item.createdAt,
      risk: careNoteWorkflowRisk(item.priority),
    })),
  ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()).slice(0, 20);

  const printHref = buildReportPrintHref({ reportType, sections: sectionQuery(selectedSections), from: controls.from, to: controls.to, preset: controls.presetId });
  const reportHistory: ReportHistoryItem[] = [
    {
      id: "current-draft",
      title: selectedPreset ? `${selectedPreset.label} draft` : `${reportTypeLabels[reportType]} draft`,
      description: `${selectedSections.length} sections • ${medications.length + appointments.length + labs.length + vitals.length + symptoms.length + documents.length + alerts.length + careNotes.length} source records • ${controls.from || controls.to ? "date-filtered" : "all records"}`,
      href: printHref,
      generatedAt: now,
      status: readinessScore >= 75 ? "ready" : readinessScore >= 50 ? "review" : "attention",
      recordCount: medications.length + appointments.length + labs.length + vitals.length + symptoms.length + documents.length + alerts.length + careNotes.length,
    },
    ...(timeline[0]
      ? [{
          id: "latest-event",
          title: `Latest packet event: ${timeline[0].title}`,
          description: `${timeline[0].type} • ${timeline[0].detail}`,
          href: `/timeline`,
          generatedAt: timeline[0].occurredAt,
          status: timeline[0].risk === "urgent" ? "attention" as const : timeline[0].risk === "watch" ? "review" as const : "ready" as const,
          recordCount: timeline.length,
        }]
      : []),
    {
      id: "pre-share-checks",
      title: "Pre-share review queue",
      description: actionItems.map((item) => item.title).slice(0, 2).join(" • "),
      href: actionItems[0]?.href || printHref,
      generatedAt: now,
      status: actionItems.some((item) => item.priority === "high") ? "attention" : actionItems.some((item) => item.priority === "medium") ? "review" : "ready",
      recordCount: actionItems.length,
    },
  ];

  return {
    reportType,
    reportTitle: reportTypeLabels[reportType],
    selectedPreset,
    presets: reportBuilderPresets,
    selectedSections,
    sectionDefinitions: reportSections,
    range: {
      from: controls.from,
      to: controls.to,
      label: from || to ? `${from ? formatDate(from) : "Beginning"} to ${to ? formatDate(to) : "Today"}` : "All available records",
    },
    summary: {
      readinessScore,
      selectedSectionCount: selectedSections.length,
      availableSectionCount: reportSections.length,
      totalRecords: medications.length + appointments.length + labs.length + vitals.length + symptoms.length + documents.length + alerts.length + careNotes.length,
      highRiskAlerts,
      abnormalLabs,
      unresolvedSymptoms,
      careNotes: careNotes.length,
      urgentCareNotes: careNotes.filter((note) => note.priority === "URGENT").length,
      pinnedCareNotes: careNotes.filter((note) => note.pinned).length,
      documentLinkRate,
      medicationAdherenceRate,
    },
    savedReports: savedReports.map(mapSavedReportToHistoryItem),
    savedReportStats: summarizeSavedReportStats(savedReports),
    profile,
    medications,
    appointments,
    labs,
    vitals,
    symptoms,
    documents,
    alerts,
    careAccess,
    careNotes,
    aiInsight,
    actionItems,
    timeline,
    reportHistory,
  };
}

export function isSectionSelected(sections: ReportSectionKey[], key: ReportSectionKey) {
  return sections.includes(key);
}
