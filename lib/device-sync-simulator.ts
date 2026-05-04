import {
  DeviceConnectionStatus,
  DevicePlatform,
  DeviceReadingType,
  JobKind,
  JobRunStatus,
  ReadingSource,
  SyncJobStatus,
} from "@prisma/client";
import { db } from "@/lib/db";

export type SimulatorProvider = {
  source: ReadingSource;
  platform: DevicePlatform;
  title: string;
  description: string;
  readings: string[];
  tone: "neutral" | "info" | "success" | "warning" | "danger";
};

export type SimulatorReadingInput = {
  readingType: DeviceReadingType;
  capturedAt: Date;
  unit?: string;
  valueInt?: number;
  valueFloat?: number;
  systolic?: number;
  diastolic?: number;
};

export const simulatorProviders: SimulatorProvider[] = [
  {
    source: ReadingSource.APPLE_HEALTH,
    platform: DevicePlatform.IOS,
    title: "Apple Health demo sync",
    description: "Simulates a HealthKit-style mobile sync with activity, heart rate, oxygen, and weight readings.",
    readings: ["heart rate", "oxygen", "weight", "steps"],
    tone: "info",
  },
  {
    source: ReadingSource.ANDROID_HEALTH_CONNECT,
    platform: DevicePlatform.ANDROID,
    title: "Android Health Connect demo sync",
    description: "Simulates an Android wellness import with daily activity and recent vital readings.",
    readings: ["steps", "heart rate", "blood glucose", "weight"],
    tone: "success",
  },
  {
    source: ReadingSource.SMART_BP_MONITOR,
    platform: DevicePlatform.OTHER,
    title: "Smart BP monitor demo sync",
    description: "Simulates a home blood-pressure monitor pushing recent BP and pulse readings.",
    readings: ["blood pressure", "heart rate"],
    tone: "warning",
  },
  {
    source: ReadingSource.PULSE_OXIMETER,
    platform: DevicePlatform.OTHER,
    title: "Pulse oximeter demo sync",
    description: "Simulates a respiratory monitoring device syncing oxygen saturation and pulse readings.",
    readings: ["oxygen", "heart rate", "temperature"],
    tone: "danger",
  },
  {
    source: ReadingSource.SMART_SCALE,
    platform: DevicePlatform.OTHER,
    title: "Smart scale demo sync",
    description: "Simulates a connected scale importing weight trend data for monitoring dashboards.",
    readings: ["weight"],
    tone: "neutral",
  },
];

export function parseSimulatorSource(value: FormDataEntryValue | null): ReadingSource {
  const raw = String(value || "");
  const match = simulatorProviders.find((provider) => provider.source === raw);
  return match?.source || ReadingSource.APPLE_HEALTH;
}

export function getSimulatorProvider(source: ReadingSource) {
  return simulatorProviders.find((provider) => provider.source === source) || simulatorProviders[0];
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

export function buildSimulatorReadings(source: ReadingSource): SimulatorReadingInput[] {
  if (source === ReadingSource.SMART_BP_MONITOR) {
    return [
      { readingType: DeviceReadingType.BLOOD_PRESSURE, capturedAt: minutesAgo(18), systolic: 128, diastolic: 82, unit: "mmHg" },
      { readingType: DeviceReadingType.BLOOD_PRESSURE, capturedAt: minutesAgo(70), systolic: 136, diastolic: 88, unit: "mmHg" },
      { readingType: DeviceReadingType.HEART_RATE, capturedAt: minutesAgo(18), valueInt: 76, unit: "bpm" },
    ];
  }

  if (source === ReadingSource.PULSE_OXIMETER) {
    return [
      { readingType: DeviceReadingType.OXYGEN_SATURATION, capturedAt: minutesAgo(11), valueInt: 97, unit: "%" },
      { readingType: DeviceReadingType.HEART_RATE, capturedAt: minutesAgo(11), valueInt: 82, unit: "bpm" },
      { readingType: DeviceReadingType.TEMPERATURE, capturedAt: minutesAgo(35), valueFloat: 36.8, unit: "C" },
    ];
  }

  if (source === ReadingSource.SMART_SCALE) {
    return [
      { readingType: DeviceReadingType.WEIGHT, capturedAt: minutesAgo(25), valueFloat: 71.4, unit: "kg" },
      { readingType: DeviceReadingType.WEIGHT, capturedAt: minutesAgo(60 * 24), valueFloat: 71.9, unit: "kg" },
      { readingType: DeviceReadingType.WEIGHT, capturedAt: minutesAgo(60 * 48), valueFloat: 72.1, unit: "kg" },
    ];
  }

  if (source === ReadingSource.ANDROID_HEALTH_CONNECT) {
    return [
      { readingType: DeviceReadingType.STEPS, capturedAt: minutesAgo(8), valueInt: 6240, unit: "steps" },
      { readingType: DeviceReadingType.HEART_RATE, capturedAt: minutesAgo(20), valueInt: 74, unit: "bpm" },
      { readingType: DeviceReadingType.BLOOD_GLUCOSE, capturedAt: minutesAgo(95), valueFloat: 104, unit: "mg/dL" },
      { readingType: DeviceReadingType.WEIGHT, capturedAt: minutesAgo(60 * 20), valueFloat: 70.8, unit: "kg" },
    ];
  }

  return [
    { readingType: DeviceReadingType.STEPS, capturedAt: minutesAgo(6), valueInt: 8120, unit: "steps" },
    { readingType: DeviceReadingType.HEART_RATE, capturedAt: minutesAgo(14), valueInt: 72, unit: "bpm" },
    { readingType: DeviceReadingType.OXYGEN_SATURATION, capturedAt: minutesAgo(22), valueInt: 98, unit: "%" },
    { readingType: DeviceReadingType.WEIGHT, capturedAt: minutesAgo(60 * 26), valueFloat: 70.5, unit: "kg" },
  ];
}

export function readingDisplayValue(reading: {
  readingType: DeviceReadingType;
  unit: string | null;
  valueInt: number | null;
  valueFloat: number | null;
  systolic: number | null;
  diastolic: number | null;
}) {
  if (reading.readingType === DeviceReadingType.BLOOD_PRESSURE && reading.systolic && reading.diastolic) {
    return String(reading.systolic) + "/" + String(reading.diastolic) + " " + (reading.unit || "mmHg");
  }

  const value = reading.valueInt ?? reading.valueFloat;
  if (value === null || value === undefined) return "—";
  return String(value) + (reading.unit ? " " + reading.unit : "");
}

export function readingLabel(type: DeviceReadingType) {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function getDeviceSyncSimulatorData(userId: string) {
  const [connections, recentReadings, recentSyncJobs, mirroredVitals] = await Promise.all([
    db.deviceConnection.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 8,
      select: {
        id: true,
        source: true,
        platform: true,
        deviceLabel: true,
        status: true,
        lastSyncedAt: true,
        lastError: true,
        createdAt: true,
        _count: { select: { readings: true, syncJobs: true, jobRuns: true } },
      },
    }),
    db.deviceReading.findMany({
      where: { userId },
      orderBy: { capturedAt: "desc" },
      take: 12,
      select: {
        id: true,
        source: true,
        platform: true,
        readingType: true,
        capturedAt: true,
        unit: true,
        valueInt: true,
        valueFloat: true,
        systolic: true,
        diastolic: true,
      },
    }),
    db.syncJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        source: true,
        platform: true,
        status: true,
        requestedCount: true,
        acceptedCount: true,
        mirroredCount: true,
        errorMessage: true,
        createdAt: true,
        finishedAt: true,
      },
    }),
    db.vitalRecord.findMany({
      where: { userId, readingSource: { not: ReadingSource.MANUAL } },
      orderBy: { recordedAt: "desc" },
      take: 8,
      select: {
        id: true,
        recordedAt: true,
        readingSource: true,
        systolic: true,
        diastolic: true,
        heartRate: true,
        bloodSugar: true,
        oxygenSaturation: true,
        temperatureC: true,
        weightKg: true,
        notes: true,
      },
    }),
  ]);

  const activeConnections = connections.filter((connection) => connection.status === DeviceConnectionStatus.ACTIVE).length;
  const erroredConnections = connections.filter((connection) => connection.status === DeviceConnectionStatus.ERROR).length;
  const mirroredCount = recentSyncJobs.reduce((total, job) => total + job.mirroredCount, 0);
  const acceptedCount = recentSyncJobs.reduce((total, job) => total + job.acceptedCount, 0);

  return {
    providers: simulatorProviders,
    connections,
    recentReadings,
    recentSyncJobs,
    mirroredVitals,
    summary: {
      totalConnections: connections.length,
      activeConnections,
      erroredConnections,
      recentReadings: recentReadings.length,
      acceptedCount,
      mirroredCount,
    },
  };
}

export function vitalDisplayValue(vital: {
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null;
  bloodSugar: number | null;
  oxygenSaturation: number | null;
  temperatureC: number | null;
  weightKg: number | null;
}) {
  const parts = [
    vital.systolic && vital.diastolic ? String(vital.systolic) + "/" + String(vital.diastolic) + " BP" : null,
    vital.heartRate ? String(vital.heartRate) + " bpm" : null,
    vital.bloodSugar ? String(vital.bloodSugar) + " glucose" : null,
    vital.oxygenSaturation ? String(vital.oxygenSaturation) + "% SpO2" : null,
    vital.temperatureC ? String(vital.temperatureC) + " C" : null,
    vital.weightKg ? String(vital.weightKg) + " kg" : null,
  ].filter(Boolean);

  return parts.join(" • ") || "Mirrored vital reading";
}
