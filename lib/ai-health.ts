import { db } from "@/lib/db";
import { logAccessAudit } from "@/lib/access";
import { openai, OPENAI_MODEL } from "@/lib/openai";

export type PatientInsightResult = {
  title: string;
  summary: string;
  adherenceRisk: "low" | "medium" | "high";
  trendFlags: Array<{
    type: "medications" | "appointments" | "labs" | "vitals" | "symptoms" | "general";
    severity: "info" | "warning" | "urgent";
    message: string;
  }>;
  suggestedQuestions: string[];
  recommendedFollowUp: string[];
  disclaimer: string;
};

export async function buildPatientInsightContext(ownerUserId: string) {
  const [
    owner,
    medications,
    appointments,
    labs,
    vitals,
    symptoms,
    vaccinations,
    documents,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: ownerUserId },
      select: {
        id: true,
        name: true,
        email: true,
        healthProfile: true,
      },
    }),
    db.medication.findMany({
      where: { userId: ownerUserId },
      orderBy: { createdAt: "desc" },
      include: {
        schedules: true,
        doctor: true,
        logs: {
          orderBy: { loggedAt: "desc" },
          take: 14,
        },
      },
      take: 20,
    }),
    db.appointment.findMany({
      where: { userId: ownerUserId },
      orderBy: { scheduledAt: "desc" },
      take: 20,
    }),
    db.labResult.findMany({
      where: { userId: ownerUserId },
      orderBy: { dateTaken: "desc" },
      take: 15,
    }),
    db.vitalRecord.findMany({
      where: { userId: ownerUserId },
      orderBy: { recordedAt: "desc" },
      take: 20,
    }),
    db.symptomEntry.findMany({
      where: { userId: ownerUserId },
      orderBy: { startedAt: "desc" },
      take: 20,
    }),
    db.vaccinationRecord.findMany({
      where: { userId: ownerUserId },
      orderBy: { dateTaken: "desc" },
      take: 20,
    }),
    db.medicalDocument.findMany({
      where: { userId: ownerUserId },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  return {
    patient: {
      id: owner?.id,
      name: owner?.healthProfile?.fullName ?? owner?.name ?? "Unknown",
      email: owner?.email,
      profile: owner?.healthProfile
        ? {
            dateOfBirth: owner.healthProfile.dateOfBirth?.toISOString() ?? null,
            sex: owner.healthProfile.sex,
            bloodType: owner.healthProfile.bloodType,
            heightCm: owner.healthProfile.heightCm,
            weightKg: owner.healthProfile.weightKg,
            chronicConditions: owner.healthProfile.chronicConditions,
            allergiesSummary: owner.healthProfile.allergiesSummary,
            emergencyContactName: owner.healthProfile.emergencyContactName,
            emergencyContactPhone: owner.healthProfile.emergencyContactPhone,
            notes: owner.healthProfile.notes,
          }
        : null,
    },
    medications: medications.map((item) => ({
      name: item.name,
      dosage: item.dosage,
      frequency: item.frequency,
      instructions: item.instructions,
      status: item.status,
      active: item.active,
      startDate: item.startDate.toISOString(),
      endDate: item.endDate?.toISOString() ?? null,
      doctorName: item.doctor?.name ?? null,
      schedules: item.schedules.map((s) => s.timeOfDay),
      logs: item.logs.map((log) => ({
        loggedAt: log.loggedAt.toISOString(),
        status: log.status,
        scheduleTime: log.scheduleTime,
        notes: log.notes,
      })),
    })),
    appointments: appointments.map((item) => ({
      doctorName: item.doctorName,
      clinic: item.clinic,
      specialty: item.specialty,
      scheduledAt: item.scheduledAt.toISOString(),
      purpose: item.purpose,
      status: item.status,
      notes: item.notes,
      followUpNotes: item.followUpNotes,
    })),
    labs: labs.map((item) => ({
      testName: item.testName,
      dateTaken: item.dateTaken.toISOString(),
      resultSummary: item.resultSummary,
      referenceRange: item.referenceRange,
      flag: item.flag,
      hasFile: Boolean(item.filePath),
    })),
    vitals: vitals.map((item) => ({
      recordedAt: item.recordedAt.toISOString(),
      systolic: item.systolic,
      diastolic: item.diastolic,
      heartRate: item.heartRate,
      bloodSugar: item.bloodSugar,
      oxygenSaturation: item.oxygenSaturation,
      temperatureC: item.temperatureC,
      weightKg: item.weightKg,
      notes: item.notes,
    })),
    symptoms: symptoms.map((item) => ({
      title: item.title,
      severity: item.severity,
      bodyArea: item.bodyArea,
      startedAt: item.startedAt.toISOString(),
      duration: item.duration,
      trigger: item.trigger,
      notes: item.notes,
      resolved: item.resolved,
    })),
    vaccinations: vaccinations.map((item) => ({
      vaccineName: item.vaccineName,
      doseNumber: item.doseNumber,
      dateTaken: item.dateTaken.toISOString(),
      location: item.location,
      nextDueDate: item.nextDueDate?.toISOString() ?? null,
      notes: item.notes,
    })),
    documents: documents.map((item) => ({
      title: item.title,
      type: item.type,
      createdAt: item.createdAt.toISOString(),
      fileName: item.fileName,
      notes: item.notes,
    })),
  };
}

const insightSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    adherenceRisk: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    trendFlags: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: {
            type: "string",
            enum: ["medications", "appointments", "labs", "vitals", "symptoms", "general"],
          },
          severity: {
            type: "string",
            enum: ["info", "warning", "urgent"],
          },
          message: { type: "string" },
        },
        required: ["type", "severity", "message"],
      },
    },
    suggestedQuestions: {
      type: "array",
      items: { type: "string" },
    },
    recommendedFollowUp: {
      type: "array",
      items: { type: "string" },
    },
    disclaimer: { type: "string" },
  },
  required: [
    "title",
    "summary",
    "adherenceRisk",
    "trendFlags",
    "suggestedQuestions",
    "recommendedFollowUp",
    "disclaimer",
  ],
};

function buildFallbackInsight(context: Awaited<ReturnType<typeof buildPatientInsightContext>>): PatientInsightResult {
  const highOrLowLabs = context.labs.filter((item) => item.flag !== "NORMAL");
  const unresolvedSymptoms = context.symptoms.filter((item) => !item.resolved);
  const recentVitals = context.vitals.slice(0, 5);
  const missedMedicationLogs = context.medications.flatMap((m) => m.logs).filter((log) => log.status === "MISSED");

  const trendFlags: PatientInsightResult["trendFlags"] = [];

  if (highOrLowLabs.length > 0) {
    trendFlags.push({
      type: "labs",
      severity: highOrLowLabs.length >= 2 ? "warning" : "info",
      message: `${highOrLowLabs.length} recent lab result(s) were marked outside normal range.`,
    });
  }

  const highBpCount = recentVitals.filter(
    (item) => (item.systolic ?? 0) >= 140 || (item.diastolic ?? 0) >= 90
  ).length;

  if (highBpCount > 0) {
    trendFlags.push({
      type: "vitals",
      severity: highBpCount >= 2 ? "warning" : "info",
      message: `${highBpCount} recent blood pressure reading(s) appear elevated.`,
    });
  }

  const highSugarCount = recentVitals.filter((item) => (item.bloodSugar ?? 0) >= 180).length;

  if (highSugarCount > 0) {
    trendFlags.push({
      type: "vitals",
      severity: highSugarCount >= 2 ? "warning" : "info",
      message: `${highSugarCount} recent blood sugar reading(s) appear higher than expected.`,
    });
  }

  if (missedMedicationLogs.length > 0) {
    trendFlags.push({
      type: "medications",
      severity: missedMedicationLogs.length >= 3 ? "warning" : "info",
      message: `${missedMedicationLogs.length} missed medication log(s) were recorded recently.`,
    });
  }

  if (unresolvedSymptoms.length > 0) {
    trendFlags.push({
      type: "symptoms",
      severity: unresolvedSymptoms.some((s) => s.severity === "SEVERE") ? "warning" : "info",
      message: `${unresolvedSymptoms.length} symptom entry/entries remain unresolved.`,
    });
  }

  if (trendFlags.length === 0) {
    trendFlags.push({
      type: "general",
      severity: "info",
      message: "No major warning patterns were detected in the currently saved records.",
    });
  }

  const adherenceRisk: "low" | "medium" | "high" =
    missedMedicationLogs.length >= 4 ? "high" : missedMedicationLogs.length >= 1 ? "medium" : "low";

  const patientName = context.patient.name || "the patient";

  return {
    title: "Demo health insight",
    summary:
      `This is a locally generated fallback summary for ${patientName}. ` +
      `VitaVault reviewed medications, appointments, labs, vitals, and symptoms already stored in the database. ` +
      `The current focus should be medication consistency, reviewing any abnormal lab or vital trends, and preparing follow-up questions for the next consultation.`,
    adherenceRisk,
    trendFlags,
    suggestedQuestions: [
      "Are any of the abnormal or borderline results already being monitored by a clinician?",
      "Have there been any recent missed doses, side effects, or schedule changes?",
      "Which symptoms are improving, and which ones are still ongoing?",
    ],
    recommendedFollowUp: [
      "Review recent abnormal labs and elevated vitals with a healthcare professional.",
      "Confirm the medication routine and reinforce logging consistency.",
      "Track repeat readings to see whether current patterns are isolated or persistent.",
    ],
    disclaimer:
      "Demo mode: this fallback insight was generated locally because live AI was unavailable. It is informational only and not a diagnosis.",
  };
}

async function saveInsight(args: {
  ownerUserId: string;
  actorUserId: string;
  result: PatientInsightResult;
  metadata?: Record<string, unknown>;
}) {
  const saved = await db.aiInsight.create({
    data: {
      ownerUserId: args.ownerUserId,
      generatedByUserId: args.actorUserId,
      title: args.result.title,
      summary: args.result.summary,
      adherenceRisk: args.result.adherenceRisk,
      trendFlagsJson: JSON.stringify(args.result.trendFlags),
      suggestedQuestionsJson: JSON.stringify(args.result.suggestedQuestions),
      recommendedFollowUpJson: JSON.stringify(args.result.recommendedFollowUp),
      disclaimer: args.result.disclaimer,
    },
  });

  await logAccessAudit({
    ownerUserId: args.ownerUserId,
    actorUserId: args.actorUserId,
    action: "AI_INSIGHT_GENERATED",
    targetType: "AiInsight",
    targetId: saved.id,
    metadata: args.metadata ?? null,
  });

  return saved;
}

export async function generatePatientHealthInsight(args: {
  ownerUserId: string;
  actorUserId: string;
}) {
  const context = await buildPatientInsightContext(args.ownerUserId);

  if (!openai) {
    const fallback = buildFallbackInsight(context);
    return saveInsight({
      ownerUserId: args.ownerUserId,
      actorUserId: args.actorUserId,
      result: fallback,
      metadata: {
        mode: "fallback",
        reason: "OPENAI_API_KEY missing",
      },
    });
  }

  try {
    const response = await openai.responses.create({
      model: OPENAI_MODEL,
      instructions: [
        "You are VitaVault Care Insight, an informational healthcare assistant.",
        "You are NOT diagnosing, prescribing, replacing a doctor, or issuing emergency triage decisions.",
        "Use only the structured patient data provided.",
        "Give concise, practical, non-diagnostic observations.",
        "Flag patterns worth discussing with a clinician.",
        "Always include a disclaimer that the output is informational and not a diagnosis.",
        "Return only valid JSON matching the schema.",
      ].join(" "),
      input: JSON.stringify(context),
      text: {
        format: {
          type: "json_schema",
          name: "vitavault_patient_insight",
          strict: true,
          schema: insightSchema,
        },
      },
    });

    const raw = response.output_text?.trim();

    if (!raw) {
      throw new Error("AI did not return structured output.");
    }

    const parsed = JSON.parse(raw) as PatientInsightResult;

    return saveInsight({
      ownerUserId: args.ownerUserId,
      actorUserId: args.actorUserId,
      result: parsed,
      metadata: {
        mode: "live",
        model: OPENAI_MODEL,
        adherenceRisk: parsed.adherenceRisk,
      },
    });
  } catch (error) {
    const fallback = buildFallbackInsight(context);
    const message = error instanceof Error ? error.message : "Unknown AI error";

    return saveInsight({
      ownerUserId: args.ownerUserId,
      actorUserId: args.actorUserId,
      result: {
        ...fallback,
        disclaimer:
          "Demo mode: live AI could not be reached or billing/quota is unavailable. This fallback summary is informational only and not a diagnosis.",
      },
      metadata: {
        mode: "fallback",
        reason: message,
      },
    });
  }
}