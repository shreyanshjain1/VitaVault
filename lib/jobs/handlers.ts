import { ReadingSource, ReminderState, SyncJobStatus } from "@prisma/client";
import { db } from "@/lib/db";
import {
  type AlertEvaluationJobData,
  type AlertEvaluationJobResult,
  type DailyHealthSummaryJobData,
  type DailyHealthSummaryJobResult,
  type DeviceSyncProcessingJobData,
  type DeviceSyncProcessingJobResult,
  type ReminderGenerationJobData,
  type ReminderGenerationJobResult,
  type ReminderOverdueEvaluationJobData,
  type ReminderOverdueEvaluationJobResult,
} from "@/lib/jobs/contracts";
import { runAlertEvaluation } from "@/lib/alerts/service";
import {
  generateReminderInstances,
  markDueRemindersAsOverdue,
} from "@/lib/reminders/service";

export async function handleAlertEvaluationJob(
  payload: AlertEvaluationJobData
): Promise<AlertEvaluationJobResult> {
  return runAlertEvaluation({
    userId: payload.userId,
    sourceType: payload.sourceType ?? null,
    sourceId: payload.sourceId ?? null,
    sourceRecordedAt: payload.sourceRecordedAt ?? null,
    initiatedBy: payload.initiatedBy ?? "manual_scan",
  });
}

export async function handleReminderGenerationJob(
  payload: ReminderGenerationJobData
): Promise<ReminderGenerationJobResult> {
  const result = await generateReminderInstances({
    userId: payload.userId,
    targetDate: payload.targetDate ? new Date(payload.targetDate) : new Date(),
    requestedByUserId: payload.requestedByUserId ?? null,
  });

  return {
    ok: true,
    created: result.created,
    deduped: result.deduped,
  };
}

export async function handleReminderOverdueEvaluationJob(
  payload: ReminderOverdueEvaluationJobData
): Promise<ReminderOverdueEvaluationJobResult> {
  const result = await markDueRemindersAsOverdue({
    userId: payload.userId,
    requestedByUserId: payload.requestedByUserId ?? null,
  });

  return {
    ok: true,
    overdueMarked: result.overdueMarked,
    missedMarked: result.missedMarked,
  };
}

export async function handleDailyHealthSummaryJob(
  payload: DailyHealthSummaryJobData
): Promise<DailyHealthSummaryJobResult> {
  const [profile, vitals, symptoms, medications] = await Promise.all([
    db.healthProfile.findUnique({
      where: { userId: payload.userId },
    }),
    db.vitalRecord.findMany({
      where: { userId: payload.userId },
      orderBy: { recordedAt: "desc" },
      take: 10,
    }),
    db.symptomEntry.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.medication.findMany({
      where: { userId: payload.userId, active: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const openReminderCount = await db.reminder.count({
    where: {
      userId: payload.userId,
      state: {
        in: [ReminderState.DUE, ReminderState.SENT, ReminderState.OVERDUE],
      },
    },
  });

  const summaryLines = [
    `Profile: ${profile?.fullName ?? "Unknown patient"}`,
    `Recent vitals logged: ${vitals.length}`,
    `Recent symptom entries: ${symptoms.length}`,
    `Active medications: ${medications.length}`,
    `Open reminders: ${openReminderCount}`,
  ];

  await db.aiInsight.create({
    data: {
      ownerUserId: payload.userId,
      generatedByUserId: payload.requestedByUserId ?? null,
      title: "Daily Health Summary",
      summary: summaryLines.join("\n"),
      adherenceRisk: openReminderCount > 0 ? "Needs review" : "Stable",
      trendFlagsJson: JSON.stringify({
        vitalsCount: vitals.length,
        symptomsCount: symptoms.length,
        reminderCount: openReminderCount,
      }),
      suggestedQuestionsJson: JSON.stringify([
        "Were all medications taken today?",
        "Any worsening symptoms since the last update?",
        "Are any reminders overdue or missed?",
      ]),
      recommendedFollowUpJson: JSON.stringify([
        "Review pending reminders",
        "Update vitals if readings are available",
        "Check upcoming medications and appointments",
      ]),
      disclaimer:
        "AI-generated summary for informational use only and not a medical diagnosis.",
    },
  });

  return { ok: true };
}

export async function handleDeviceSyncProcessingJob(
  payload: DeviceSyncProcessingJobData
): Promise<DeviceSyncProcessingJobResult> {
  const connection =
    payload.connectionId != null
      ? await db.deviceConnection.findUnique({
          where: { id: payload.connectionId },
        })
      : null;

  if (payload.syncJobId) {
    await db.syncJob.update({
      where: { id: payload.syncJobId },
      data: {
        status: SyncJobStatus.RUNNING,
        startedAt: new Date(),
      },
    });
  }

  const readings = await db.deviceReading.findMany({
    where: {
      userId: payload.userId,
      ...(payload.connectionId ? { connectionId: payload.connectionId } : {}),
    },
    orderBy: { capturedAt: "asc" },
    take: 200,
  });

  for (const reading of readings) {
    if (reading.readingType === "HEART_RATE") {
      const externalReadingId = `device:${reading.id}:hr`;
      const existing = await db.vitalRecord.findFirst({ where: { externalReadingId } });

      if (!existing) {
        await db.vitalRecord.create({
          data: {
            userId: payload.userId,
            recordedAt: reading.capturedAt,
            heartRate: reading.valueInt ?? null,
            externalReadingId,
            readingSource:
              connection?.source && Object.values(ReadingSource).includes(connection.source)
                ? connection.source
                : ReadingSource.OTHER,
          },
        });
      }
    }

    if (reading.readingType === "WEIGHT") {
      const externalReadingId = `device:${reading.id}:weight`;
      const existing = await db.vitalRecord.findFirst({ where: { externalReadingId } });

      if (!existing) {
        await db.vitalRecord.create({
          data: {
            userId: payload.userId,
            recordedAt: reading.capturedAt,
            weightKg: reading.valueFloat ?? null,
            externalReadingId,
            readingSource:
              connection?.source && Object.values(ReadingSource).includes(connection.source)
                ? connection.source
                : ReadingSource.OTHER,
          },
        });
      }
    }

    if (reading.readingType === "BLOOD_PRESSURE") {
      const externalReadingId = `device:${reading.id}:bp`;
      const existing = await db.vitalRecord.findFirst({ where: { externalReadingId } });

      if (!existing) {
        await db.vitalRecord.create({
          data: {
            userId: payload.userId,
            recordedAt: reading.capturedAt,
            systolic: reading.systolic ?? null,
            diastolic: reading.diastolic ?? null,
            externalReadingId,
            readingSource:
              connection?.source && Object.values(ReadingSource).includes(connection.source)
                ? connection.source
                : ReadingSource.OTHER,
          },
        });
      }
    }

    if (reading.readingType === "BLOOD_GLUCOSE") {
      const externalReadingId = `device:${reading.id}:glucose`;
      const existing = await db.vitalRecord.findFirst({ where: { externalReadingId } });

      if (!existing) {
        await db.vitalRecord.create({
          data: {
            userId: payload.userId,
            recordedAt: reading.capturedAt,
            bloodSugar: reading.valueFloat ?? null,
            externalReadingId,
            readingSource:
              connection?.source && Object.values(ReadingSource).includes(connection.source)
                ? connection.source
                : ReadingSource.OTHER,
          },
        });
      }
    }

    if (reading.readingType === "OXYGEN_SATURATION") {
      const externalReadingId = `device:${reading.id}:oxygen`;
      const existing = await db.vitalRecord.findFirst({ where: { externalReadingId } });

      if (!existing) {
        await db.vitalRecord.create({
          data: {
            userId: payload.userId,
            recordedAt: reading.capturedAt,
            oxygenSaturation: reading.valueInt ?? null,
            externalReadingId,
            readingSource:
              connection?.source && Object.values(ReadingSource).includes(connection.source)
                ? connection.source
                : ReadingSource.OTHER,
          },
        });
      }
    }

    if (reading.readingType === "TEMPERATURE") {
      const externalReadingId = `device:${reading.id}:temp`;
      const existing = await db.vitalRecord.findFirst({ where: { externalReadingId } });

      if (!existing) {
        await db.vitalRecord.create({
          data: {
            userId: payload.userId,
            recordedAt: reading.capturedAt,
            temperatureC: reading.valueFloat ?? null,
            externalReadingId,
            readingSource:
              connection?.source && Object.values(ReadingSource).includes(connection.source)
                ? connection.source
                : ReadingSource.OTHER,
          },
        });
      }
    }
  }

  if (payload.connectionId) {
    await db.deviceConnection.update({
      where: { id: payload.connectionId },
      data: {
        lastSyncedAt: new Date(),
        lastError: null,
      },
    });
  }

  if (payload.syncJobId) {
    await db.syncJob.update({
      where: { id: payload.syncJobId },
      data: {
        status: SyncJobStatus.SUCCEEDED,
        finishedAt: new Date(),
        errorMessage: null,
      },
    });
  }

  return { ok: true };
}