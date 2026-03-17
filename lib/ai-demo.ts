import { db } from "@/lib/db";
import { logAccessAudit } from "@/lib/access";

function startOfLast7Days() {
  const now = new Date();
  now.setDate(now.getDate() - 7);
  return now;
}

export async function createDemoAiInsight(args: {
  ownerUserId: string;
  actorUserId: string;
  reason?: string;
}) {
  const [owner, activeMedicationCount, latestLab, latestVital, missedLogs, upcomingAppointment] =
    await Promise.all([
      db.user.findUnique({
        where: { id: args.ownerUserId },
        select: {
          name: true,
          email: true,
          healthProfile: {
            select: {
              fullName: true,
              bloodType: true,
              allergiesSummary: true,
              chronicConditions: true,
            },
          },
        },
      }),
      db.medication.count({
        where: {
          userId: args.ownerUserId,
          active: true,
        },
      }),
      db.labResult.findFirst({
        where: { userId: args.ownerUserId },
        orderBy: { dateTaken: "desc" },
      }),
      db.vitalRecord.findFirst({
        where: { userId: args.ownerUserId },
        orderBy: { recordedAt: "desc" },
      }),
      db.medicationLog.count({
        where: {
          userId: args.ownerUserId,
          status: "MISSED",
          loggedAt: {
            gte: startOfLast7Days(),
          },
        },
      }),
      db.appointment.findFirst({
        where: {
          userId: args.ownerUserId,
          status: "UPCOMING",
        },
        orderBy: { scheduledAt: "asc" },
      }),
    ]);

  const patientName =
    owner?.healthProfile?.fullName ?? owner?.name ?? "Patient";

  const adherenceRisk =
    missedLogs >= 3 ? "high" : missedLogs >= 1 ? "medium" : "low";

  const trendFlags: Array<{
    type: "medications" | "appointments" | "labs" | "vitals" | "symptoms" | "general";
    severity: "info" | "warning" | "urgent";
    message: string;
  }> = [];

  if (missedLogs > 0) {
    trendFlags.push({
      type: "medications",
      severity: missedLogs >= 3 ? "warning" : "info",
      message: `${missedLogs} missed medication log${missedLogs > 1 ? "s" : ""} recorded in the last 7 days.`,
    });
  }

  if (latestLab && latestLab.flag !== "NORMAL") {
    trendFlags.push({
      type: "labs",
      severity: latestLab.flag === "HIGH" || latestLab.flag === "LOW" ? "warning" : "info",
      message: `Latest lab result "${latestLab.testName}" is flagged as ${latestLab.flag}.`,
    });
  }

  if (
    latestVital &&
    latestVital.systolic &&
    latestVital.diastolic &&
    (latestVital.systolic >= 140 || latestVital.diastolic >= 90)
  ) {
    trendFlags.push({
      type: "vitals",
      severity: "warning",
      message: `Latest blood pressure reading is ${latestVital.systolic}/${latestVital.diastolic}.`,
    });
  }

  if (upcomingAppointment) {
    trendFlags.push({
      type: "appointments",
      severity: "info",
      message: `Next appointment is scheduled for ${upcomingAppointment.scheduledAt.toLocaleString()}.`,
    });
  }

  if (trendFlags.length === 0) {
    trendFlags.push({
      type: "general",
      severity: "info",
      message: "No major automated risk patterns were found in the available stored records.",
    });
  }

  const suggestedQuestions = [
    "Are all active medications still being taken as prescribed?",
    "Are there any new symptoms or side effects since the last update?",
    "Should any recent abnormal lab or vital trend be reviewed with a clinician?",
  ];

  const recommendedFollowUp = [
    activeMedicationCount
      ? `Review ${activeMedicationCount} active medication${activeMedicationCount > 1 ? "s" : ""} for adherence and current relevance.`
      : "Add medication records if applicable for a more useful insight summary.",
    latestLab
      ? `Discuss the latest lab result "${latestLab.testName}" if clarification is needed.`
      : "Add a recent lab result for better clinical context.",
    upcomingAppointment
      ? "Use the next appointment to review current trends and open follow-up questions."
      : "Schedule a follow-up visit if ongoing symptoms or concerns exist.",
  ];

  const summary = [
    `${patientName} has ${activeMedicationCount} active medication${activeMedicationCount !== 1 ? "s" : ""} on file.`,
    latestLab
      ? `The latest recorded lab is "${latestLab.testName}" with a flag of ${latestLab.flag}.`
      : "No recent lab result is currently available.",
    latestVital
      ? `The latest vital record was captured on ${latestVital.recordedAt.toLocaleString()}.`
      : "No recent vital record is currently available.",
    missedLogs > 0
      ? `Medication adherence may need attention because ${missedLogs} missed log${missedLogs > 1 ? "s were" : " was"} recorded in the last week.`
      : "No missed medication logs were found in the last week.",
  ].join(" ");

  const insight = await db.aiInsight.create({
    data: {
      ownerUserId: args.ownerUserId,
      generatedByUserId: args.actorUserId,
      title: "Demo health overview",
      summary,
      adherenceRisk,
      trendFlagsJson: JSON.stringify(trendFlags),
      suggestedQuestionsJson: JSON.stringify(suggestedQuestions),
      recommendedFollowUpJson: JSON.stringify(recommendedFollowUp),
      disclaimer:
        "This summary was generated in demo mode because the live AI provider was unavailable. It is informational only and not a diagnosis.",
    },
  });

  await logAccessAudit({
    ownerUserId: args.ownerUserId,
    actorUserId: args.actorUserId,
    action: "AI_INSIGHT_DEMO_GENERATED",
    targetType: "AiInsight",
    targetId: insight.id,
    metadata: {
      reason: args.reason ?? "fallback",
      adherenceRisk,
    },
  });

  return insight;
}