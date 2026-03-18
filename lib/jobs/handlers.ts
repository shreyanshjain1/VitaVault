import { addDays, endOfDay, startOfDay } from "date-fns";
import { ReadingSource, ReminderType, SyncJobStatus } from "@prisma/client";
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
} from "@/lib/jobs/contracts";
import { appendJobRunLog } from "@/lib/jobs/job-run";
import { runAlertEvaluation } from "@/lib/alerts/service";

function logByJobId(
  jobRunId: string | undefined,
  level: string,
  message: string,
  context?: Record<string, unknown>
) {
  if (!jobRunId) {
    return Promise.resolve();
  }

  return appendJobRunLog({
    bullmqJobId: jobRunId,
    level,
    message,
    context: context ?? null,
  });
}

export async function handleAlertEvaluationJob(
  payload: AlertEvaluationJobData
): Promise<AlertEvaluationJobResult> {
  const result = await runAlertEvaluation({
    userId: payload.userId,
    sourceType: payload.sourceType ?? null,
    sourceId: payload.sourceId ?? null,
    sourceRecordedAt: payload.sourceRecordedAt ?? null,
    initiatedBy: payload.initiatedBy ?? "manual_scan",
  });

  return {
    evaluatedRuleCount: result.evaluatedRuleCount,
    createdAlertCount: result.createdAlertCount,
    createdAlertIds: result.createdAlertIds,
  };
}

export async function handleReminderGenerationJob(
  payload: ReminderGenerationJobData
): Promise<ReminderGenerationJobResult> {
  const today = new Date();
  const horizonEnd = addDays(today, 7);

  const [medications, appointments] = await Promise.all([
    db.medication.findMany({
      where: {
        userId: payload.userId,
        active: true,
      },
      include: {
        schedules: true,
      },
    }),
    db.appointment.findMany({
      where: {
        userId: payload.userId,
        scheduledAt: {
          gte: startOfDay(today),
          lte: endOfDay(horizonEnd),
        },
        status: "UPCOMING",
      },
    }),
  ]);

  for (const medication of medications) {
    for (const schedule of medication.schedules) {
      const existing = await db.reminder.findFirst({
        where: {
          userId: payload.userId,
          type: ReminderType.MEDICATION,
          title: `${medication.name} reminder`,
          completed: false,
        },
      });

      if (!existing) {
        const dueAt = new Date();
        await db.reminder.create({
          data: {
            userId: payload.userId,
            type: ReminderType.MEDICATION,
            title: `${medication.name} reminder`,
            description: `Scheduled dose at ${schedule.timeOfDay}`,
            dueAt,
          },
        });
      }
    }
  }

  for (const appointment of appointments) {
    const existing = await db.reminder.findFirst({
      where: {
        userId: payload.userId,
        type: ReminderType.APPOINTMENT,
        title: `Appointment: ${appointment.doctorName}`,
        dueAt: appointment.scheduledAt,
      },
    });

    if (!existing) {
      await db.reminder.create({
        data: {
          userId: payload.userId,
          type: ReminderType.APPOINTMENT,
          title: `Appointment: ${appointment.doctorName}`,
          description: appointment.clinic,
          dueAt: appointment.scheduledAt,
        },
      });
    }
  }

  return {
    ok: true,
  };
}

export async function handleDailyHealthSummaryJob(
  payload: DailyHealthSummaryJobData
): Promise<DailyHealthSummaryJobResult> {
  const [profile, vitals, symptoms, medications, alerts] = await Promise.all([
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
    db.alertEvent.findMany({
      where: { userId: payload.userId, status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const summaryLines = [
    `Profile: ${profile?.fullName ?? "Unknown patient"}`,
    `Recent vitals logged: ${vitals.length}`,
    `Recent symptom entries: ${symptoms.length}`,
    `Active medications: ${medications.length}`,
    `Open alerts: ${alerts.length}`,
  ];

  await db.aiInsight.create({
    data: {
      ownerUserId: payload.userId,
      generatedByUserId: null,
      title: "Daily Health Summary",
      summary: summaryLines.join("\n"),
      adherenceRisk: alerts.length > 0 ? "Needs review" : "Stable",
      trendFlagsJson: JSON.stringify({
        vitalsCount: vitals.length,
        symptomsCount: symptoms.length,
        alertsCount: alerts.length,
      }),
      suggestedQuestionsJson: JSON.stringify([
        "Were all medications taken today?",
        "Any worsening symptoms since the last update?",
        "Do any open alerts need review?",
      ]),
      recommendedFollowUpJson: JSON.stringify([
        "Review open alerts",
        "Update vitals if readings are available",
        "Check upcoming medications and appointments",
      ]),
      disclaimer:
        "AI-generated summary for informational use only and not a medical diagnosis.",
    },
  });

  return {
    ok: true,
  };
}

export async function handleDeviceSyncProcessingJob(
  payload: DeviceSyncProcessingJobData
): Promise<DeviceSyncProcessingJobResult> {
  const syncJob =
    payload.syncJobId != null
      ? await db.syncJob.findUnique({
          where: { id: payload.syncJobId },
        })
      : null;

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

      const existing = await db.vitalRecord.findFirst({
        where: { externalReadingId },
      });

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

      const existing = await db.vitalRecord.findFirst({
        where: { externalReadingId },
      });

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

      const existing = await db.vitalRecord.findFirst({
        where: { externalReadingId },
      });

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

      const existing = await db.vitalRecord.findFirst({
        where: { externalReadingId },
      });

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

      const existing = await db.vitalRecord.findFirst({
        where: { externalReadingId },
      });

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

      const existing = await db.vitalRecord.findFirst({
        where: { externalReadingId },
      });

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

  return {
    ok: true,
  };
}