"use server";

import {
  DeviceConnectionStatus,
  DeviceReadingType,
  JobKind,
  JobRunStatus,
  ReadingSource,
  SyncJobStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  buildSimulatorReadings,
  getSimulatorProvider,
  parseSimulatorSource,
  type SimulatorReadingInput,
} from "@/lib/device-sync-simulator";

function dedupeKey(userId: string, source: ReadingSource, reading: SimulatorReadingInput) {
  return [
    "simulator",
    userId,
    source,
    reading.readingType,
    reading.capturedAt.toISOString(),
    reading.valueInt ?? "",
    reading.valueFloat ?? "",
    reading.systolic ?? "",
    reading.diastolic ?? "",
  ].join(":");
}

function vitalDataForReading(userId: string, source: ReadingSource, reading: SimulatorReadingInput, key: string) {
  if (reading.readingType === DeviceReadingType.STEPS) return null;

  return {
    userId,
    recordedAt: reading.capturedAt,
    externalReadingId: key,
    readingSource: source,
    notes: "Mirrored from VitaVault device sync simulator.",
    systolic: reading.readingType === DeviceReadingType.BLOOD_PRESSURE ? reading.systolic ?? null : null,
    diastolic: reading.readingType === DeviceReadingType.BLOOD_PRESSURE ? reading.diastolic ?? null : null,
    heartRate: reading.readingType === DeviceReadingType.HEART_RATE ? reading.valueInt ?? null : null,
    bloodSugar: reading.readingType === DeviceReadingType.BLOOD_GLUCOSE ? reading.valueFloat ?? null : null,
    oxygenSaturation: reading.readingType === DeviceReadingType.OXYGEN_SATURATION ? reading.valueInt ?? null : null,
    temperatureC: reading.readingType === DeviceReadingType.TEMPERATURE ? reading.valueFloat ?? null : null,
    weightKg: reading.readingType === DeviceReadingType.WEIGHT ? reading.valueFloat ?? null : null,
  };
}

export async function runDeviceSyncSimulationAction(formData: FormData) {
  const user = await requireUser();
  const source = parseSimulatorSource(formData.get("source"));
  const provider = getSimulatorProvider(source);
  const readings = buildSimulatorReadings(source);
  const startedAt = new Date();

  const connection = await db.deviceConnection.upsert({
    where: {
      userId_source_clientDeviceId: {
        userId: user.id,
        source,
        clientDeviceId: "vitavault-simulator-" + source.toLowerCase(),
      },
    },
    create: {
      userId: user.id,
      source,
      platform: provider.platform,
      clientDeviceId: "vitavault-simulator-" + source.toLowerCase(),
      deviceLabel: provider.title,
      appVersion: "simulator-1.0",
      scopesJson: JSON.stringify(provider.readings),
      lastSyncedAt: startedAt,
    },
    update: {
      platform: provider.platform,
      deviceLabel: provider.title,
      status: DeviceConnectionStatus.ACTIVE,
      lastSyncedAt: startedAt,
      lastError: null,
      scopesJson: JSON.stringify(provider.readings),
    },
    select: { id: true },
  });

  const syncJob = await db.syncJob.create({
    data: {
      userId: user.id,
      connectionId: connection.id,
      source,
      platform: provider.platform,
      status: SyncJobStatus.RUNNING,
      requestedCount: readings.length,
      acceptedCount: 0,
      mirroredCount: 0,
      startedAt,
      metadataJson: JSON.stringify({ simulator: true, provider: provider.title }),
    },
    select: { id: true },
  });

  const jobRun = await db.jobRun.create({
    data: {
      queueName: "device-sync-simulator",
      jobName: provider.title,
      jobKind: JobKind.DEVICE_SYNC_PROCESSING,
      status: JobRunStatus.ACTIVE,
      userId: user.id,
      connectionId: connection.id,
      syncJobId: syncJob.id,
      inputJson: JSON.stringify({ source, requestedCount: readings.length }),
      startedAt,
      maxAttempts: 1,
    },
    select: { id: true },
  });

  let acceptedCount = 0;
  let mirroredCount = 0;

  for (const reading of readings) {
    const key = dedupeKey(user.id, source, reading);

    await db.deviceReading.upsert({
      where: { dedupeKey: key },
      create: {
        userId: user.id,
        connectionId: connection.id,
        source,
        platform: provider.platform,
        readingType: reading.readingType,
        capturedAt: reading.capturedAt,
        dedupeKey: key,
        unit: reading.unit,
        valueInt: reading.valueInt,
        valueFloat: reading.valueFloat,
        systolic: reading.systolic,
        diastolic: reading.diastolic,
        metadataJson: JSON.stringify({ simulator: true, provider: provider.title }),
        rawPayloadJson: JSON.stringify(reading),
      },
      update: {
        connectionId: connection.id,
        capturedAt: reading.capturedAt,
        unit: reading.unit,
        valueInt: reading.valueInt,
        valueFloat: reading.valueFloat,
        systolic: reading.systolic,
        diastolic: reading.diastolic,
        metadataJson: JSON.stringify({ simulator: true, provider: provider.title }),
        rawPayloadJson: JSON.stringify(reading),
      },
    });

    acceptedCount += 1;

    const vitalData = vitalDataForReading(user.id, source, reading, key);
    if (vitalData) {
      await db.vitalRecord.upsert({
        where: { externalReadingId: key },
        create: vitalData,
        update: vitalData,
      });
      mirroredCount += 1;
    }
  }

  const finishedAt = new Date();

  await db.syncJob.update({
    where: { id: syncJob.id },
    data: {
      status: SyncJobStatus.SUCCEEDED,
      acceptedCount,
      mirroredCount,
      finishedAt,
      metadataJson: JSON.stringify({ simulator: true, provider: provider.title, acceptedCount, mirroredCount }),
    },
  });

  await db.jobRun.update({
    where: { id: jobRun.id },
    data: {
      status: JobRunStatus.COMPLETED,
      attemptsMade: 1,
      finishedAt,
      resultJson: JSON.stringify({ acceptedCount, mirroredCount, syncJobId: syncJob.id }),
    },
  });

  await db.jobRunLog.create({
    data: {
      jobRunId: jobRun.id,
      level: "info",
      message: "Device sync simulator completed successfully.",
      contextJson: JSON.stringify({ source, acceptedCount, mirroredCount }),
    },
  });

  revalidatePath("/device-sync-simulator");
  revalidatePath("/device-connection");
  revalidatePath("/vitals-monitor");
  revalidatePath("/trends");
}
