import {
  DevicePlatform,
  DeviceReadingType,
  ReadingSource,
  SyncJobStatus,
} from "@prisma/client";
import { db } from "@/lib/db";

export type IncomingReading = {
  readingType: DeviceReadingType;
  capturedAt: string;
  clientReadingId?: string | null;
  unit?: string | null;
  valueInt?: number | null;
  valueFloat?: number | null;
  systolic?: number | null;
  diastolic?: number | null;
  metadata?: Record<string, unknown> | null;
  rawPayload?: Record<string, unknown> | null;
};

export type UpsertConnectionInput = {
  userId: string;
  source: ReadingSource;
  platform: DevicePlatform;
  clientDeviceId: string;
  deviceLabel?: string | null;
  appVersion?: string | null;
  scopes?: string[] | null;
};

function normalizeCapturedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid capturedAt value: ${value}`);
  }
  return date;
}

function buildDedupeKey(params: {
  userId: string;
  source: ReadingSource;
  platform: DevicePlatform;
  clientDeviceId: string;
  reading: IncomingReading;
}) {
  const capturedAt = normalizeCapturedAt(params.reading.capturedAt).toISOString();
  const type = params.reading.readingType;
  const clientReadingId = params.reading.clientReadingId?.trim();

  if (clientReadingId) {
    return [
      params.userId,
      params.source,
      params.platform,
      params.clientDeviceId,
      type,
      clientReadingId,
    ].join("|");
  }

  return [
    params.userId,
    params.source,
    params.platform,
    params.clientDeviceId,
    type,
    capturedAt,
    params.reading.valueInt ?? "",
    params.reading.valueFloat ?? "",
    params.reading.systolic ?? "",
    params.reading.diastolic ?? "",
  ].join("|");
}

export async function upsertDeviceConnection(input: UpsertConnectionInput) {
  return db.deviceConnection.upsert({
    where: {
      userId_source_clientDeviceId: {
        userId: input.userId,
        source: input.source,
        clientDeviceId: input.clientDeviceId,
      },
    },
    update: {
      platform: input.platform,
      deviceLabel: input.deviceLabel ?? null,
      appVersion: input.appVersion ?? null,
      scopesJson: input.scopes?.length ? JSON.stringify(input.scopes) : null,
      status: "ACTIVE",
      lastError: null,
      lastSyncedAt: new Date(),
    },
    create: {
      userId: input.userId,
      source: input.source,
      platform: input.platform,
      clientDeviceId: input.clientDeviceId,
      deviceLabel: input.deviceLabel ?? null,
      appVersion: input.appVersion ?? null,
      scopesJson: input.scopes?.length ? JSON.stringify(input.scopes) : null,
      status: "ACTIVE",
      lastSyncedAt: new Date(),
    },
  });
}

function toVitalRecordData(params: {
  userId: string;
  source: ReadingSource;
  readingId: string;
  reading: IncomingReading;
}) {
  const capturedAt = normalizeCapturedAt(params.reading.capturedAt);

  switch (params.reading.readingType) {
    case DeviceReadingType.HEART_RATE:
      return {
        userId: params.userId,
        recordedAt: capturedAt,
        heartRate: params.reading.valueInt ?? null,
        notes: `Synced via ${params.source}`,
        readingSource: params.source,
        externalReadingId: params.readingId,
      };

    case DeviceReadingType.WEIGHT:
      return {
        userId: params.userId,
        recordedAt: capturedAt,
        weightKg: params.reading.valueFloat ?? null,
        notes: `Synced via ${params.source}`,
        readingSource: params.source,
        externalReadingId: params.readingId,
      };

    case DeviceReadingType.BLOOD_PRESSURE:
      return {
        userId: params.userId,
        recordedAt: capturedAt,
        systolic: params.reading.systolic ?? null,
        diastolic: params.reading.diastolic ?? null,
        notes: `Synced via ${params.source}`,
        readingSource: params.source,
        externalReadingId: params.readingId,
      };

    case DeviceReadingType.OXYGEN_SATURATION:
      return {
        userId: params.userId,
        recordedAt: capturedAt,
        oxygenSaturation: params.reading.valueInt ?? null,
        notes: `Synced via ${params.source}`,
        readingSource: params.source,
        externalReadingId: params.readingId,
      };

    case DeviceReadingType.BLOOD_GLUCOSE:
      return {
        userId: params.userId,
        recordedAt: capturedAt,
        bloodSugar: params.reading.valueFloat ?? null,
        notes: `Synced via ${params.source}`,
        readingSource: params.source,
        externalReadingId: params.readingId,
      };

    case DeviceReadingType.TEMPERATURE:
      return {
        userId: params.userId,
        recordedAt: capturedAt,
        temperatureC: params.reading.valueFloat ?? null,
        notes: `Synced via ${params.source}`,
        readingSource: params.source,
        externalReadingId: params.readingId,
      };

    default:
      return null;
  }
}

export async function ingestDeviceReadings(params: {
  userId: string;
  source: ReadingSource;
  platform: DevicePlatform;
  connectionId: string;
  clientDeviceId: string;
  readings: IncomingReading[];
  syncMetadata?: Record<string, unknown> | null;
}) {
  const syncJob = await db.syncJob.create({
    data: {
      userId: params.userId,
      connectionId: params.connectionId,
      source: params.source,
      platform: params.platform,
      status: SyncJobStatus.RUNNING,
      requestedCount: params.readings.length,
      acceptedCount: 0,
      mirroredCount: 0,
      startedAt: new Date(),
      metadataJson: params.syncMetadata ? JSON.stringify(params.syncMetadata) : null,
    },
  });

  let acceptedCount = 0;
  let mirroredCount = 0;

  try {
    for (const reading of params.readings) {
      const dedupeKey = buildDedupeKey({
        userId: params.userId,
        source: params.source,
        platform: params.platform,
        clientDeviceId: params.clientDeviceId,
        reading,
      });

      const existing = await db.deviceReading.findUnique({
        where: { dedupeKey },
        select: { id: true },
      });

      if (existing) {
        continue;
      }

      const createdReading = await db.deviceReading.create({
        data: {
          userId: params.userId,
          connectionId: params.connectionId,
          source: params.source,
          platform: params.platform,
          readingType: reading.readingType,
          capturedAt: normalizeCapturedAt(reading.capturedAt),
          dedupeKey,
          unit: reading.unit ?? null,
          valueInt: reading.valueInt ?? null,
          valueFloat: reading.valueFloat ?? null,
          systolic: reading.systolic ?? null,
          diastolic: reading.diastolic ?? null,
          metadataJson: reading.metadata ? JSON.stringify(reading.metadata) : null,
          rawPayloadJson: reading.rawPayload ? JSON.stringify(reading.rawPayload) : null,
        },
      });

      acceptedCount += 1;

      const vitalData = toVitalRecordData({
        userId: params.userId,
        source: params.source,
        readingId: createdReading.id,
        reading,
      });

      if (vitalData) {
        await db.vitalRecord.create({
          data: vitalData,
        });
        mirroredCount += 1;
      }
    }

    await db.deviceConnection.update({
      where: { id: params.connectionId },
      data: {
        lastSyncedAt: new Date(),
        lastError: null,
        status: "ACTIVE",
      },
    });

    await db.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status:
          acceptedCount === params.readings.length
            ? SyncJobStatus.SUCCEEDED
            : acceptedCount > 0
            ? SyncJobStatus.PARTIAL
            : SyncJobStatus.SUCCEEDED,
        acceptedCount,
        mirroredCount,
        finishedAt: new Date(),
      },
    });

    return {
      syncJobId: syncJob.id,
      acceptedCount,
      mirroredCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";

    await db.deviceConnection.update({
      where: { id: params.connectionId },
      data: {
        lastError: message,
        status: "ERROR",
      },
    });

    await db.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: SyncJobStatus.FAILED,
        acceptedCount,
        mirroredCount,
        errorMessage: message,
        finishedAt: new Date(),
      },
    });

    throw error;
  }
}