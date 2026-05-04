import { AlertSeverity, AlertStatus, AppointmentStatus, LabFlag, MedicationLogStatus, ReminderState, SymptomSeverity } from "@prisma/client";
import { db } from "@/lib/db";

export type InsightTrendFlag = {
  type: string;
  severity: string;
  message: string;
};

export type ParsedAiInsight = {
  id: string;
  title: string;
  summary: string;
  adherenceRisk: string;
  trendFlags: InsightTrendFlag[];
  suggestedQuestions: string[];
  recommendedFollowUp: string[];
  disclaimer: string;
  createdAt: Date;
};

export type AiEvidenceCard = {
  label: string;
  count: number;
  latestAt: Date | null;
  href: string;
  note: string;
  status: "Ready" | "Sparse" | "Missing";
};

export type AiRiskSignal = {
  id: string;
  title: string;
  detail: string;
  severity: "urgent" | "warning" | "info";
  href: string;
};

export type AiFollowUpItem = {
  id: string;
  title: string;
  detail: string;
  source: string;
  href: string;
};

export type SharedAiPatient = {
  id: string;
  patientName: string;
  email: string;
  accessRole: string;
  href: string;
};

export type AiSourceCitationCard = {
  id: string;
  label: string;
  recordType: string;
  title: string;
  detail: string;
  capturedAt: Date | null;
  href: string;
  tone: "neutral" | "info" | "success" | "warning" | "danger";
};

export type AiConfidenceMetric = {
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "info" | "success" | "warning" | "danger";
};

export type AiSourceGap = {
  id: string;
  title: string;
  detail: string;
  href: string;
  priority: "low" | "medium" | "high";
};

function parseJsonArray<T>(value: string | null): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function latestDate(items: Array<{ createdAt?: Date; updatedAt?: Date; recordedAt?: Date; dateTaken?: Date; startedAt?: Date; scheduledAt?: Date; dueAt?: Date }>) {
  const timestamps = items
    .flatMap((item) => [item.updatedAt, item.createdAt, item.recordedAt, item.dateTaken, item.startedAt, item.scheduledAt, item.dueAt])
    .filter((value): value is Date => Boolean(value))
    .map((value) => value.getTime());

  if (!timestamps.length) return null;
  return new Date(Math.max(...timestamps));
}

function evidenceStatus(count: number, readyAt = 2): AiEvidenceCard["status"] {
  if (count <= 0) return "Missing";
  if (count < readyAt) return "Sparse";
  return "Ready";
}

function calculateReadinessScore(args: {
  hasProfile: boolean;
  medicationCount: number;
  labCount: number;
  vitalCount: number;
  symptomCount: number;
  documentCount: number;
  appointmentCount: number;
  insightCount: number;
}) {
  const checks = [
    args.hasProfile,
    args.medicationCount > 0,
    args.labCount > 0,
    args.vitalCount > 0,
    args.symptomCount > 0,
    args.documentCount > 0,
    args.appointmentCount > 0,
    args.insightCount > 0,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function parseInsight(item: {
  id: string;
  title: string;
  summary: string;
  adherenceRisk: string;
  trendFlagsJson: string;
  suggestedQuestionsJson: string;
  recommendedFollowUpJson: string;
  disclaimer: string;
  createdAt: Date;
}): ParsedAiInsight {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    adherenceRisk: item.adherenceRisk,
    trendFlags: parseJsonArray<InsightTrendFlag>(item.trendFlagsJson),
    suggestedQuestions: parseJsonArray<string>(item.suggestedQuestionsJson),
    recommendedFollowUp: parseJsonArray<string>(item.recommendedFollowUpJson),
    disclaimer: item.disclaimer,
    createdAt: item.createdAt,
  };
}


function formatVitalDetail(vital: { systolic: number | null; diastolic: number | null; heartRate: number | null; oxygenSaturation: number | null; bloodSugar: number | null; temperatureC: number | null; weightKg: number | null }) {
  const parts = [
    vital.systolic && vital.diastolic ? `${vital.systolic}/${vital.diastolic} BP` : null,
    vital.heartRate ? `${vital.heartRate} bpm` : null,
    vital.oxygenSaturation ? `${vital.oxygenSaturation}% SpO2` : null,
    vital.bloodSugar ? `${vital.bloodSugar} glucose` : null,
    vital.temperatureC ? `${vital.temperatureC}°C` : null,
    vital.weightKg ? `${vital.weightKg} kg` : null,
  ].filter(Boolean);

  return parts.join(" • ") || "Vitals captured";
}

function priorityTone(priority: "low" | "medium" | "high") {
  if (priority === "high") return "danger" as const;
  if (priority === "medium") return "warning" as const;
  return "info" as const;
}

export async function getAiInsightsWorkspaceData(userId: string) {
  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    user,
    insightsRaw,
    medications,
    appointments,
    labs,
    vitals,
    symptoms,
    documents,
    reminders,
    alerts,
    sharedPatientsRaw,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        healthProfile: true,
      },
    }),
    db.aiInsight.findMany({
      where: { ownerUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    db.medication.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        doctor: { select: { id: true, name: true, specialty: true } },
        schedules: { select: { id: true, timeOfDay: true } },
        logs: {
          where: { loggedAt: { gte: thirtyDaysAgo } },
          orderBy: { loggedAt: "desc" },
          take: 60,
          select: { id: true, status: true, loggedAt: true },
        },
      },
    }),
    db.appointment.findMany({
      where: { userId },
      orderBy: { scheduledAt: "desc" },
      take: 20,
    }),
    db.labResult.findMany({
      where: { userId, dateTaken: { gte: ninetyDaysAgo } },
      orderBy: { dateTaken: "desc" },
      take: 20,
    }),
    db.vitalRecord.findMany({
      where: { userId, recordedAt: { gte: ninetyDaysAgo } },
      orderBy: { recordedAt: "desc" },
      take: 30,
    }),
    db.symptomEntry.findMany({
      where: { userId, startedAt: { gte: ninetyDaysAgo } },
      orderBy: { startedAt: "desc" },
      take: 30,
    }),
    db.medicalDocument.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.reminder.findMany({
      where: { userId, state: { in: [ReminderState.DUE, ReminderState.OVERDUE, ReminderState.MISSED] } },
      orderBy: { dueAt: "asc" },
      take: 12,
    }),
    db.alertEvent.findMany({
      where: { userId, status: AlertStatus.OPEN },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    db.careAccess.findMany({
      where: {
        memberUserId: userId,
        status: "ACTIVE",
        canGenerateAIInsights: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            healthProfile: { select: { fullName: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  const insights = insightsRaw.map(parseInsight);
  const latestInsight = insights[0] ?? null;
  const activeMedications = medications.filter((item) => item.active);
  const missedLogs = medications.flatMap((item) => item.logs).filter((log) => log.status === MedicationLogStatus.MISSED);
  const abnormalLabs = labs.filter((item) => item.flag !== LabFlag.NORMAL);
  const unresolvedSymptoms = symptoms.filter((item) => !item.resolved);
  const severeSymptoms = unresolvedSymptoms.filter((item) => item.severity === SymptomSeverity.SEVERE);
  const urgentAlerts = alerts.filter((item) => item.severity === AlertSeverity.CRITICAL || item.severity === AlertSeverity.HIGH);
  const upcomingAppointments = appointments.filter((item) => item.status === AppointmentStatus.UPCOMING && item.scheduledAt >= now);
  const elevatedVitals = vitals.filter((item) => {
    const highBp = (item.systolic ?? 0) >= 140 || (item.diastolic ?? 0) >= 90;
    const lowOxygen = (item.oxygenSaturation ?? 100) < 94;
    const highSugar = (item.bloodSugar ?? 0) >= 180;
    return highBp || lowOxygen || highSugar;
  });

  const evidenceCards: AiEvidenceCard[] = [
    {
      label: "Medications",
      count: medications.length,
      latestAt: latestDate(medications),
      href: "/medications",
      note: `${activeMedications.length} active medication${activeMedications.length === 1 ? "" : "s"} available for adherence review.`,
      status: evidenceStatus(medications.length),
    },
    {
      label: "Labs",
      count: labs.length,
      latestAt: latestDate(labs),
      href: "/lab-review",
      note: `${abnormalLabs.length} recent result${abnormalLabs.length === 1 ? "" : "s"} are outside normal range.`,
      status: evidenceStatus(labs.length),
    },
    {
      label: "Vitals",
      count: vitals.length,
      latestAt: latestDate(vitals),
      href: "/vitals-monitor",
      note: `${elevatedVitals.length} recent vital reading${elevatedVitals.length === 1 ? "" : "s"} may need review.`,
      status: evidenceStatus(vitals.length, 3),
    },
    {
      label: "Symptoms",
      count: symptoms.length,
      latestAt: latestDate(symptoms),
      href: "/symptom-review",
      note: `${unresolvedSymptoms.length} unresolved symptom${unresolvedSymptoms.length === 1 ? "" : "s"} are in the recent journal.`,
      status: evidenceStatus(symptoms.length),
    },
    {
      label: "Documents",
      count: documents.length,
      latestAt: latestDate(documents),
      href: "/documents",
      note: `${documents.filter((item) => item.linkedRecordId).length} document${documents.length === 1 ? "" : "s"} have linked record context.`,
      status: evidenceStatus(documents.length),
    },
    {
      label: "Appointments",
      count: appointments.length,
      latestAt: latestDate(appointments),
      href: "/visit-prep",
      note: `${upcomingAppointments.length} upcoming appointment${upcomingAppointments.length === 1 ? "" : "s"} can use AI talking points.`,
      status: evidenceStatus(appointments.length),
    },
  ];

  const riskSignals: AiRiskSignal[] = [];

  urgentAlerts.slice(0, 3).forEach((alert) => {
    riskSignals.push({
      id: `alert-${alert.id}`,
      title: alert.title,
      detail: alert.message,
      severity: alert.severity === AlertSeverity.CRITICAL ? "urgent" : "warning",
      href: `/alerts/${alert.id}`,
    });
  });

  if (abnormalLabs.length > 0) {
    riskSignals.push({
      id: "abnormal-labs",
      title: "Abnormal lab pattern",
      detail: `${abnormalLabs.length} recent lab result${abnormalLabs.length === 1 ? "" : "s"} are marked high, low, or borderline.`,
      severity: abnormalLabs.length >= 3 ? "warning" : "info",
      href: "/lab-review",
    });
  }

  if (severeSymptoms.length > 0) {
    riskSignals.push({
      id: "severe-symptoms",
      title: "Severe unresolved symptoms",
      detail: `${severeSymptoms.length} severe symptom${severeSymptoms.length === 1 ? "" : "s"} remain unresolved.`,
      severity: "warning",
      href: "/symptom-review?severity=SEVERE&status=unresolved",
    });
  }

  if (missedLogs.length > 0) {
    riskSignals.push({
      id: "missed-medications",
      title: "Medication adherence signal",
      detail: `${missedLogs.length} missed medication log${missedLogs.length === 1 ? "" : "s"} were recorded in the last 30 days.`,
      severity: missedLogs.length >= 3 ? "warning" : "info",
      href: "/medication-safety",
    });
  }

  if (elevatedVitals.length > 0) {
    riskSignals.push({
      id: "vital-review",
      title: "Vitals worth reviewing",
      detail: `${elevatedVitals.length} recent reading${elevatedVitals.length === 1 ? "" : "s"} may need a closer look before the next visit.`,
      severity: "info",
      href: "/vitals-monitor",
    });
  }

  const followUpItems: AiFollowUpItem[] = [
    ...((latestInsight?.recommendedFollowUp ?? []).slice(0, 4).map((detail, index) => ({
      id: `ai-followup-${index}`,
      title: "AI recommended follow-up",
      detail,
      source: "Latest insight",
      href: "/ai-insights",
    }))),
    ...reminders.slice(0, 4).map((reminder) => ({
      id: `reminder-${reminder.id}`,
      title: reminder.title,
      detail: reminder.description || `Due ${reminder.dueAt.toLocaleDateString()}`,
      source: "Reminder",
      href: "/reminders",
    })),
  ].slice(0, 6);

  const sharedPatients: SharedAiPatient[] = sharedPatientsRaw.map((grant) => ({
    id: grant.id,
    patientName: grant.owner.healthProfile?.fullName ?? grant.owner.name ?? "Patient",
    email: grant.owner.email,
    accessRole: grant.accessRole,
    href: `/patient/${grant.owner.id}`,
  }));

  const readinessScore = calculateReadinessScore({
    hasProfile: Boolean(user?.healthProfile),
    medicationCount: medications.length,
    labCount: labs.length,
    vitalCount: vitals.length,
    symptomCount: symptoms.length,
    documentCount: documents.length,
    appointmentCount: appointments.length,
    insightCount: insights.length,
  });

  const sourceCitationCards: AiSourceCitationCard[] = [
    ...activeMedications.slice(0, 3).map((item) => ({
      id: `medication-${item.id}`,
      label: "Medication",
      recordType: "Medication",
      title: item.name,
      detail: [item.dosage, item.frequency, item.doctor?.name ? `Provider: ${item.doctor.name}` : null].filter(Boolean).join(" • "),
      capturedAt: item.updatedAt ?? item.startDate,
      href: `/medications?focus=${item.id}`,
      tone: item.logs.some((log) => log.status === MedicationLogStatus.MISSED) ? "warning" as const : "success" as const,
    })),
    ...labs.slice(0, 4).map((item) => ({
      id: `lab-${item.id}`,
      label: "Lab",
      recordType: "Lab result",
      title: item.testName,
      detail: `${item.flag} • ${item.resultSummary}`,
      capturedAt: item.dateTaken,
      href: `/lab-review?q=${encodeURIComponent(item.testName)}`,
      tone: item.flag === LabFlag.NORMAL ? "success" as const : "warning" as const,
    })),
    ...vitals.slice(0, 4).map((item) => ({
      id: `vital-${item.id}`,
      label: "Vital",
      recordType: "Vital reading",
      title: "Recent vital reading",
      detail: formatVitalDetail(item),
      capturedAt: item.recordedAt,
      href: "/vitals-monitor",
      tone: elevatedVitals.some((vital) => vital.id === item.id) ? "warning" as const : "info" as const,
    })),
    ...symptoms.slice(0, 4).map((item) => ({
      id: `symptom-${item.id}`,
      label: "Symptom",
      recordType: "Symptom entry",
      title: item.title,
      detail: `${item.severity}${item.resolved ? " • resolved" : " • unresolved"}${item.bodyArea ? ` • ${item.bodyArea}` : ""}`,
      capturedAt: item.startedAt,
      href: `/symptom-review?q=${encodeURIComponent(item.title)}`,
      tone: item.severity === SymptomSeverity.SEVERE && !item.resolved ? "danger" as const : "info" as const,
    })),
    ...documents.slice(0, 3).map((item) => ({
      id: `document-${item.id}`,
      label: "Document",
      recordType: "Medical document",
      title: item.title,
      detail: `${item.type} • ${item.linkedRecordType ? `Linked to ${item.linkedRecordType}` : "Not linked"}`,
      capturedAt: item.createdAt,
      href: "/documents",
      tone: item.linkedRecordType ? "success" as const : "warning" as const,
    })),
    ...upcomingAppointments.slice(0, 2).map((item) => ({
      id: `appointment-${item.id}`,
      label: "Appointment",
      recordType: "Appointment",
      title: item.purpose,
      detail: `${item.doctorName} • ${item.clinic}`,
      capturedAt: item.scheduledAt,
      href: "/visit-prep",
      tone: "info" as const,
    })),
    ...alerts.slice(0, 3).map((item) => ({
      id: `alert-${item.id}`,
      label: "Alert",
      recordType: "Alert event",
      title: item.title,
      detail: item.message,
      capturedAt: item.createdAt,
      href: `/alerts/${item.id}`,
      tone: item.severity === AlertSeverity.CRITICAL || item.severity === AlertSeverity.HIGH ? "danger" as const : "warning" as const,
    })),
  ]
    .sort((a, b) => (b.capturedAt?.getTime() ?? 0) - (a.capturedAt?.getTime() ?? 0))
    .slice(0, 12);

  const sourceGaps: AiSourceGap[] = [];

  if (!user?.healthProfile) {
    sourceGaps.push({
      id: "profile-gap",
      title: "Complete the health profile",
      detail: "AI summaries are stronger when baseline details, allergies, emergency contact, and care context are available.",
      href: "/onboarding",
      priority: "high",
    });
  }

  if (labs.length === 0) {
    sourceGaps.push({
      id: "lab-gap",
      title: "Add recent lab results",
      detail: "Lab data gives AI better evidence for trend flags and provider questions.",
      href: "/labs",
      priority: "medium",
    });
  }

  if (vitals.length < 3) {
    sourceGaps.push({
      id: "vitals-gap",
      title: "Capture more vital readings",
      detail: "At least three recent readings help reduce noisy AI trend summaries.",
      href: "/vitals",
      priority: "medium",
    });
  }

  if (documents.length > 0 && documents.every((item) => !item.linkedRecordType)) {
    sourceGaps.push({
      id: "document-link-gap",
      title: "Link documents to records",
      detail: "Linked documents give reports and AI summaries better traceability.",
      href: "/documents?link=UNLINKED",
      priority: "low",
    });
  }

  if (activeMedications.length > 0 && activeMedications.every((item) => item.logs.length === 0)) {
    sourceGaps.push({
      id: "adherence-gap",
      title: "Log medication adherence",
      detail: "Dose logs help AI separate medication schedule context from actual adherence behavior.",
      href: "/medication-safety",
      priority: "medium",
    });
  }

  const confidenceMetrics: AiConfidenceMetric[] = [
    {
      label: "Source coverage",
      value: `${evidenceCards.filter((item) => item.status === "Ready").length}/${evidenceCards.length}`,
      detail: "Modules with enough structured records for a stronger summary.",
      tone: evidenceCards.filter((item) => item.status === "Ready").length >= 4 ? "success" : "warning",
    },
    {
      label: "Citation pool",
      value: String(sourceCitationCards.length),
      detail: "Recent records available to show as visible evidence cards.",
      tone: sourceCitationCards.length >= 6 ? "success" : "warning",
    },
    {
      label: "Open risk context",
      value: String(riskSignals.length),
      detail: "Alert, lab, symptom, medication, and vital signals available for risk review.",
      tone: riskSignals.some((item) => item.severity === "urgent") ? "danger" : riskSignals.length > 0 ? "warning" : "success",
    },
    {
      label: "Data gaps",
      value: String(sourceGaps.length),
      detail: "Known missing context that may reduce insight quality.",
      tone: sourceGaps.some((item) => item.priority === "high") ? "danger" : sourceGaps.length > 0 ? "warning" : "success",
    },
  ];

  const sourceSummary = {
    totalRecords: medications.length + appointments.length + labs.length + vitals.length + symptoms.length + documents.length,
    openAlerts: alerts.length,
    dueReminders: reminders.length,
    latestGeneratedAt: latestInsight?.createdAt ?? null,
    promptModules: evidenceCards.filter((item) => item.count > 0).map((item) => item.label),
  };

  return {
    patientLabel: user?.healthProfile?.fullName ?? user?.name ?? user?.email ?? "Patient",
    readinessScore,
    insights,
    latestInsight,
    evidenceCards,
    riskSignals: riskSignals.slice(0, 6),
    followUpItems,
    sharedPatients,
    sourceCitationCards,
    confidenceMetrics,
    sourceGaps: sourceGaps.map((item) => ({ ...item, tone: priorityTone(item.priority) })),
    sourceSummary,
    suggestedQuestions: latestInsight?.suggestedQuestions ?? [],
    transparencyNotes: [
      "AI uses structured VitaVault records only; it does not browse external medical sources or diagnose conditions.",
      "Generated summaries should be treated as visit-prep notes and reviewed with a licensed clinician.",
      "Fallback mode can still create a rule-based summary when live AI is not configured or quota is unavailable.",
    ],
  };
}
