import { addDays, endOfDay, startOfDay, subDays } from "date-fns";
import { db } from "@/lib/db";
import type {
  AlertEvaluationJobData,
  AlertEvaluationJobResult,
  DailyHealthSummaryJobData,
  DailyHealthSummaryJobResult,
  DeviceSyncProcessingJobData,
  DeviceSyncProcessingJobResult,
  ReminderGenerationJobData,
  ReminderGenerationJobResult,
} from "@/lib/jobs/contracts";
import { appendJobRunLog } from "@/lib/jobs/job-run-store";
import {
  APPOINTMENT_STATUS,
  DEVICE_READING_TYPE,
  JOB_KIND,
  READING_SOURCE,
  REMINDER_TYPE,
  SYNC_JOB_STATUS,
} from "@/lib/domain/enums";

function buildDateAtTime(baseDate: Date, timeOfDay: string) {
  const [hoursRaw, minutesRaw] = timeOfDay.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export async function handleAlertEvaluationJob(
  payload: AlertEvaluationJobData
): Promise<AlertEvaluationJobResult> {
  const vitals = await db.vitalRecord.findMany({
    where: {
      userId: payload.userId,
      recordedAt: {
        gte: subDays(new Date(), 30),
      },
    },
    orderBy: {
      recordedAt: "desc",
    },
    take: 20,
  });

  const alerts: string[] = [];

  for (const record of vitals) {
    if (
      typeof record.systolic === "number" &&
      typeof record.diastolic === "number" &&
      (record.systolic >= 140 || record.diastolic >= 90)
    ) {
      alerts.push(
        `Elevated blood pressure trend detected (${record.systolic}/${record.diastolic}).`
      );
      break;
    }
  }

  for (const record of vitals) {
    if (
      typeof record.oxygenSaturation === "number" &&
      record.oxygenSaturation < 92
    ) {
      alerts.push(
        `Low oxygen saturation reading detected (${record.oxygenSaturation}%).`
      );
      break;
    }
  }

  for (const record of vitals) {
    if (typeof record.bloodSugar === "number" && record.bloodSugar >= 180) {
      alerts.push(`High blood sugar reading detected (${record.bloodSugar}).`);
      break;
    }
  }

  for (const record of vitals) {
    if (typeof record.temperatureC === "number" && record.temperatureC >= 38) {
      alerts.push(`Elevated temperature detected (${record.temperatureC}°C).`);
      break;
    }
  }

  for (const record of vitals) {
    if (
      typeof record.heartRate === "number" &&
      (record.heartRate > 120 || record.heartRate < 50)
    ) {
      alerts.push(`Out-of-range heart rate detected (${record.heartRate} bpm).`);
      break;
    }
  }

  await appendJobRunLog(payload.jobRunId, "INFO", "Alert evaluation completed.", {
    userId: payload.userId,
    evaluatedVitals: vitals.length,
    alerts,
    informationalOnly: true,
    kind: JOB_KIND.ALERT_EVALUATION,
  });

  return {
    evaluatedVitals: vitals.length,
    alerts,
    informationalOnly: true,
    inspectedAt: new Date().toISOString(),
  };
}

export async function handleReminderGenerationJob(
  payload: ReminderGenerationJobData
): Promise<ReminderGenerationJobResult> {
  const today = new Date();
  const horizonEnd = addDays(today, payload.horizonDays);

  const [activeMedications, appointments] = await Promise.all([
    db.medication.findMany({
      where: {
        userId: payload.userId,
        active: true,
      },
      include: {
        schedules: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    db.appointment.findMany({
      where: {
        userId: payload.userId,
        status: APPOINTMENT_STATUS.UPCOMING,
        scheduledAt: {
          gte: today,
          lte: horizonEnd,
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
    }),
  ]);

  let created = 0;
  let skippedDuplicates = 0;
  let appointmentsCreated = 0;
  let medicationRemindersCreated = 0;

  for (const appointment of appointments) {
    const title = `Appointment: ${appointment.purpose}`;
    const dueAt = appointment.scheduledAt;

    const existing = await db.reminder.findFirst({
      where: {
        userId: payload.userId,
        type: REMINDER_TYPE.APPOINTMENT,
        title,
        dueAt,
      },
    });

    if (existing) {
      skippedDuplicates += 1;
      continue;
    }

    await db.reminder.create({
      data: {
        userId: payload.userId,
        type: REMINDER_TYPE.APPOINTMENT,
        title,
        description: `${appointment.doctorName} at ${appointment.clinic}`,
        dueAt,
      },
    });

    created += 1;
    appointmentsCreated += 1;
  }

  const tomorrow = addDays(today, 1);

  for (const medication of activeMedications) {
    for (const schedule of medication.schedules) {
      const nextReminderTime = buildDateAtTime(today, schedule.timeOfDay);
      if (!nextReminderTime) {
        skippedDuplicates += 1;
        continue;
      }

      const candidateDueAt =
        nextReminderTime < today
          ? buildDateAtTime(tomorrow, schedule.timeOfDay)
          : nextReminderTime;

      if (!candidateDueAt) {
        skippedDuplicates += 1;
        continue;
      }

      const title = `Medication: ${medication.name}`;
      const existing = await db.reminder.findFirst({
        where: {
          userId: payload.userId,
          type: REMINDER_TYPE.MEDICATION,
          title,
          dueAt: candidateDueAt,
        },
      });

      if (existing) {
        skippedDuplicates += 1;
        continue;
      }

      await db.reminder.create({
        data: {
          userId: payload.userId,
          type: REMINDER_TYPE.MEDICATION,
          title,
          description: `${medication.dosage} • ${medication.frequency}`,
          dueAt: candidateDueAt,
        },
      });

      created += 1;
      medicationRemindersCreated += 1;
    }
  }

  await appendJobRunLog(payload.jobRunId, "INFO", "Reminder generation completed.", {
    userId: payload.userId,
    created,
    skippedDuplicates,
    appointmentsCreated,
    medicationRemindersCreated,
  });

  return {
    created,
    skippedDuplicates,
    appointmentsCreated,
    medicationRemindersCreated,
  };
}

export async function handleDailyHealthSummaryJob(
  payload: DailyHealthSummaryJobData
): Promise<DailyHealthSummaryJobResult> {
  const targetDate = payload.targetDate ? new Date(payload.targetDate) : new Date();
  const dayStart = startOfDay(targetDate);
  const dayEnd = endOfDay(targetDate);

  const [profile, vitals, medications, reminders, logs, labs] = await Promise.all([
    db.healthProfile.findUnique({
      where: { userId: payload.userId },
    }),
    db.vitalRecord.findMany({
      where: {
        userId: payload.userId,
        recordedAt: {
          gte: subDays(targetDate, 7),
          lte: dayEnd,
        },
      },
      orderBy: {
        recordedAt: "desc",
      },
      take: 15,
    }),
    db.medication.findMany({
      where: {
        userId: payload.userId,
        active: true,
      },
      include: {
        schedules: true,
      },
    }),
    db.reminder.findMany({
      where: {
        userId: payload.userId,
        completed: false,
        dueAt: {
          gte: dayStart,
          lte: addDays(dayEnd, 2),
        },
      },
      orderBy: {
        dueAt: "asc",
      },
      take: 8,
    }),
    db.medicationLog.findMany({
      where: {
        userId: payload.userId,
        loggedAt: {
          gte: subDays(targetDate, 7),
          lte: dayEnd,
        },
      },
      orderBy: {
        loggedAt: "desc",
      },
      take: 50,
    }),
    db.labResult.findMany({
      where: {
        userId: payload.userId,
      },
      orderBy: {
        dateTaken: "desc",
      },
      take: 5,
    }),
  ]);

  const takenCount = logs.filter((item) => item.status === "TAKEN").length;
  const missedCount = logs.filter((item) => item.status === "MISSED").length;
  const skippedCount = logs.filter((item) => item.status === "SKIPPED").length;

  const trendFlags: string[] = [];
  const suggestedQuestions: string[] = [];
  const recommendedFollowUp: string[] = [];

  const latestVital = vitals[0] ?? null;
  if (latestVital?.systolic && latestVital?.diastolic) {
    trendFlags.push(
      `Latest blood pressure: ${latestVital.systolic}/${latestVital.diastolic}`
    );
  }
  if (latestVital?.bloodSugar) {
    trendFlags.push(`Latest blood sugar: ${latestVital.bloodSugar}`);
  }
  if (latestVital?.oxygenSaturation) {
    trendFlags.push(`Latest oxygen saturation: ${latestVital.oxygenSaturation}%`);
  }
  if (latestVital?.weightKg) {
    trendFlags.push(`Latest weight: ${latestVital.weightKg} kg`);
  }

  if (missedCount > 0) {
    suggestedQuestions.push("What caused missed doses this week?");
    recommendedFollowUp.push("Review medication timings and reminder coverage.");
  }
  if (reminders.length > 0) {
    suggestedQuestions.push("Which upcoming reminders need confirmation?");
    recommendedFollowUp.push("Check next appointment and medication schedule.");
  }
  if (labs.some((lab) => lab.flag !== "NORMAL")) {
    suggestedQuestions.push("Do recent lab flags need follow-up with a clinician?");
    recommendedFollowUp.push("Review abnormal or borderline lab values.");
  }
  if (!suggestedQuestions.length) {
    suggestedQuestions.push("Are there any symptom or lifestyle changes worth tracking?");
  }
  if (!recommendedFollowUp.length) {
    recommendedFollowUp.push("Continue routine logging for clearer trends.");
  }

  const adherenceRisk =
    missedCount >= 3 ? "HIGH" : missedCount >= 1 || skippedCount >= 2 ? "MEDIUM" : "LOW";

  const title = `Daily Health Summary - ${dayStart.toISOString().slice(0, 10)}`;

  const summaryLines = [
    `Patient: ${profile?.fullName ?? "Unknown"}`,
    `Active medications: ${medications.length}`,
    `Upcoming open reminders: ${reminders.length}`,
    `Medication logs (7d): taken ${takenCount}, missed ${missedCount}, skipped ${skippedCount}.`,
    latestVital
      ? `Latest vital captured on ${latestVital.recordedAt.toISOString()}.`
      : "No recent vitals captured.",
    labs.length
      ? `Recent labs reviewed: ${labs.length}.`
      : "No recent lab entries found.",
  ];

  const insight = await db.aiInsight.create({
    data: {
      ownerUserId: payload.userId,
      generatedByUserId: payload.requestedByUserId ?? null,
      title,
      summary: summaryLines.join(" "),
      adherenceRisk,
      trendFlagsJson: JSON.stringify(trendFlags),
      suggestedQuestionsJson: JSON.stringify(suggestedQuestions),
      recommendedFollowUpJson: JSON.stringify(recommendedFollowUp),
      disclaimer:
        "Informational summary only. This does not diagnose, treat, or replace a licensed clinician.",
    },
  });

  await appendJobRunLog(payload.jobRunId, "INFO", "Daily health summary generated.", {
    aiInsightId: insight.id,
    adherenceRisk,
    trendFlags,
    suggestedQuestions,
  });

  return {
    aiInsightId: insight.id,
    title: insight.title,
    trendFlags,
    suggestedQuestions,
  };
}

export async function handleDeviceSyncProcessingJob(
  payload: DeviceSyncProcessingJobData
): Promise<DeviceSyncProcessingJobResult> {
  const syncJob = await db.syncJob.findUnique({
    where: { id: payload.syncJobId },
  });

  if (!syncJob) {
    throw new Error(`SyncJob ${payload.syncJobId} not found.`);
  }

  const connection = await db.deviceConnection.findUnique({
    where: { id: payload.connectionId },
  });

  if (!connection) {
    throw new Error(`DeviceConnection ${payload.connectionId} not found.`);
  }

  await db.syncJob.update({
    where: { id: payload.syncJobId },
    data: {
      status: SYNC_JOB_STATUS.RUNNING,
      startedAt: new Date(),
      errorMessage: null,
    },
  });

  const readings = await db.deviceReading.findMany({
    where: {
      connectionId: payload.connectionId,
      userId: payload.userId,
    },
    orderBy: {
      capturedAt: "asc",
    },
    take: 500,
  });

  let mirroredVitals = 0;
  let skippedReadings = 0;

  for (const reading of readings) {
    const existingVital = await db.vitalRecord.findFirst({
      where: {
        externalReadingId: reading.id,
      },
      select: {
        id: true,
      },
    });

    if (existingVital) {
      skippedReadings += 1;
      continue;
    }

    const vitalData: {
      userId: string;
      recordedAt: Date;
      readingSource: string;
      externalReadingId: string;
      heartRate?: number;
      weightKg?: number;
      systolic?: number;
      diastolic?: number;
      oxygenSaturation?: number;
      bloodSugar?: number;
      temperatureC?: number;
      notes?: string;
    } = {
      userId: payload.userId,
      recordedAt: reading.capturedAt,
      readingSource: reading.source,
      externalReadingId: reading.id,
      notes: `Mirrored from ${reading.readingType} via background job.`,
    };

    let canMirror = true;

    switch (reading.readingType) {
      case DEVICE_READING_TYPE.HEART_RATE:
        vitalData.heartRate = reading.valueInt ?? Math.round(reading.valueFloat ?? 0);
        break;
      case DEVICE_READING_TYPE.WEIGHT:
        vitalData.weightKg = reading.valueFloat ?? reading.valueInt ?? undefined;
        break;
      case DEVICE_READING_TYPE.BLOOD_PRESSURE:
        vitalData.systolic = reading.systolic ?? undefined;
        vitalData.diastolic = reading.diastolic ?? undefined;
        break;
      case DEVICE_READING_TYPE.OXYGEN_SATURATION:
        vitalData.oxygenSaturation =
          reading.valueInt ?? Math.round(reading.valueFloat ?? 0);
        break;
      case DEVICE_READING_TYPE.BLOOD_GLUCOSE:
        vitalData.bloodSugar = reading.valueFloat ?? reading.valueInt ?? undefined;
        break;
      case DEVICE_READING_TYPE.TEMPERATURE:
        vitalData.temperatureC = reading.valueFloat ?? reading.valueInt ?? undefined;
        break;
      case DEVICE_READING_TYPE.STEPS:
        canMirror = false;
        break;
      default:
        canMirror = false;
        break;
    }

    if (!canMirror) {
      skippedReadings += 1;
      continue;
    }

    await db.vitalRecord.create({
      data: vitalData,
    });

    mirroredVitals += 1;
  }

  const finalStatus =
    mirroredVitals > 0 && skippedReadings > 0
      ? SYNC_JOB_STATUS.PARTIAL
      : skippedReadings > 0 && mirroredVitals === 0
      ? SYNC_JOB_STATUS.PARTIAL
      : SYNC_JOB_STATUS.SUCCEEDED;

  await db.syncJob.update({
    where: { id: payload.syncJobId },
    data: {
      status: finalStatus,
      requestedCount: readings.length,
      acceptedCount: readings.length,
      mirroredCount: mirroredVitals,
      finishedAt: new Date(),
      metadataJson: JSON.stringify({
        triggeredBy: payload.triggeredBy,
        skippedReadings,
      }),
    },
  });

  await db.deviceConnection.update({
    where: { id: payload.connectionId },
    data: {
      lastSyncedAt: new Date(),
      lastError: null,
    },
  });

  await appendJobRunLog(payload.jobRunId, "INFO", "Device sync processing completed.", {
    syncJobId: payload.syncJobId,
    connectionId: payload.connectionId,
    inspectedReadings: readings.length,
    mirroredVitals,
    skippedReadings,
  });

  return {
    syncJobId: payload.syncJobId,
    inspectedReadings: readings.length,
    mirroredVitals,
    skippedReadings,
  };
}