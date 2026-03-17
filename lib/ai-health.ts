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
    title: {
      type: "string",
    },
    summary: {
      type: "string",
    },
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
          message: {
            type: "string",
          },
        },
        required: ["type", "severity", "message"],
      },
    },
    suggestedQuestions: {
      type: "array",
      items: {
        type: "string",
      },
    },
    recommendedFollowUp: {
      type: "array",
      items: {
        type: "string",
      },
    },
    disclaimer: {
      type: "string",
    },
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

export async function generatePatientHealthInsight(args: {
  ownerUserId: string;
  actorUserId: string;
}) {
  if (!openai) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const context = await buildPatientInsightContext(args.ownerUserId);

  const response = await openai.responses.create({
    model: OPENAI_MODEL,
    instructions:
      [
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

  const saved = await db.aiInsight.create({
    data: {
      ownerUserId: args.ownerUserId,
      generatedByUserId: args.actorUserId,
      title: parsed.title,
      summary: parsed.summary,
      adherenceRisk: parsed.adherenceRisk,
      trendFlagsJson: JSON.stringify(parsed.trendFlags),
      suggestedQuestionsJson: JSON.stringify(parsed.suggestedQuestions),
      recommendedFollowUpJson: JSON.stringify(parsed.recommendedFollowUp),
      disclaimer: parsed.disclaimer,
    },
  });

  await logAccessAudit({
    ownerUserId: args.ownerUserId,
    actorUserId: args.actorUserId,
    action: "AI_INSIGHT_GENERATED",
    targetType: "AiInsight",
    targetId: saved.id,
    metadata: {
      model: OPENAI_MODEL,
      adherenceRisk: parsed.adherenceRisk,
    },
  });

  return saved;
}