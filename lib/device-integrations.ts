import {
  DeviceConnectionStatus,
  DevicePlatform,
  DeviceReadingType,
  ReadingSource,
  SyncJobStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import { getMobileSecurityChecklist } from "@/lib/mobile-api-security";
import { SUPPORTED_DEVICE_READINGS } from "@/lib/mobile-device-api";
import {
  buildProviderCapabilitySummary,
  getDeviceProviderConnectors,
} from "@/lib/device-provider-connectors";

export type DeviceConnectionHealthTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

export const DEVICE_QA_SAMPLE_PAYLOAD = {
  source: ReadingSource.ANDROID_HEALTH_CONNECT,
  platform: DevicePlatform.ANDROID,
  clientDeviceId: "android-pixel-8-pro",
  deviceLabel: "Pixel 8 Pro",
  appVersion: "1.0.0",
  scopes: ["vitals:write", "device:sync"],
  syncMetadata: {
    batteryLevel: 88,
    network: "wifi",
    importMode: "manual-qa-panel",
  },
  readings: [
    {
      readingType: DeviceReadingType.HEART_RATE,
      capturedAt: "2026-05-07T08:35:00.000Z",
      clientReadingId: "hr-qa-001",
      unit: "bpm",
      valueInt: 78,
    },
    {
      readingType: DeviceReadingType.BLOOD_PRESSURE,
      capturedAt: "2026-05-07T08:36:00.000Z",
      clientReadingId: "bp-qa-001",
      unit: "mmHg",
      systolic: 118,
      diastolic: 76,
    },
    {
      readingType: DeviceReadingType.WEIGHT,
      capturedAt: "2026-05-07T08:37:00.000Z",
      clientReadingId: "weight-qa-001",
      unit: "kg",
      valueFloat: 71.4,
    },
  ],
} as const;

export function sourceLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function connectionStatusTone(
  status: DeviceConnectionStatus | string,
): DeviceConnectionHealthTone {
  if (status === DeviceConnectionStatus.ACTIVE) return "success";
  if (status === DeviceConnectionStatus.ERROR) return "danger";
  if (status === DeviceConnectionStatus.DISCONNECTED) return "warning";
  if (status === DeviceConnectionStatus.REVOKED) return "danger";
  return "neutral";
}

export function syncJobStatusTone(
  status: SyncJobStatus | string,
): DeviceConnectionHealthTone {
  if (status === SyncJobStatus.SUCCEEDED) return "success";
  if (
    status === SyncJobStatus.PARTIAL ||
    status === SyncJobStatus.RUNNING ||
    status === SyncJobStatus.QUEUED
  )
    return "info";
  if (status === SyncJobStatus.FAILED) return "danger";
  return "neutral";
}

export function readingLabel(type: DeviceReadingType | string) {
  return sourceLabel(type);
}

export function readingDisplayValue(reading: {
  readingType: DeviceReadingType | string;
  unit: string | null;
  valueInt: number | null;
  valueFloat: number | null;
  systolic: number | null;
  diastolic: number | null;
}) {
  if (
    reading.readingType === DeviceReadingType.BLOOD_PRESSURE &&
    reading.systolic &&
    reading.diastolic
  ) {
    return `${reading.systolic}/${reading.diastolic} ${reading.unit || "mmHg"}`;
  }
  const value = reading.valueInt ?? reading.valueFloat;
  if (value === null || value === undefined) return "—";
  return `${value}${reading.unit ? ` ${reading.unit}` : ""}`;
}

export function parseScopes(scopesJson: string | null | undefined) {
  if (!scopesJson) return [];
  try {
    const parsed = JSON.parse(scopesJson);
    return Array.isArray(parsed)
      ? parsed.filter(
          (scope): scope is string =>
            typeof scope === "string" && scope.trim().length > 0,
        )
      : [];
  } catch {
    return [];
  }
}

export function parseJsonObject(value: string | null | undefined) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function buildConnectionHealthSummary(connection: {
  status: DeviceConnectionStatus;
  lastSyncedAt: Date | null;
  lastError: string | null;
  _count?: { readings?: number; syncJobs?: number; jobRuns?: number };
}) {
  const readingCount = connection._count?.readings ?? 0;
  const syncJobCount = connection._count?.syncJobs ?? 0;
  if (connection.status === DeviceConnectionStatus.REVOKED)
    return {
      tone: "danger" as const,
      label: "Revoked",
      description: "This device can no longer sync readings.",
    };
  if (
    connection.status === DeviceConnectionStatus.ERROR ||
    connection.lastError
  )
    return {
      tone: "danger" as const,
      label: "Needs review",
      description: connection.lastError || "Last sync ended with an error.",
    };
  if (connection.status === DeviceConnectionStatus.DISCONNECTED)
    return {
      tone: "warning" as const,
      label: "Disconnected",
      description: "The connection is paused until you mark it active again.",
    };
  if (!connection.lastSyncedAt)
    return {
      tone: "info" as const,
      label: "Ready",
      description: "Connection exists but has not synced readings yet.",
    };
  return {
    tone: "success" as const,
    label: "Healthy",
    description: `${readingCount} reading${readingCount === 1 ? "" : "s"} across ${syncJobCount} sync job${syncJobCount === 1 ? "" : "s"}.`,
  };
}

export const DEVICE_SYNC_ATTENTION_HOURS = 24;
export const DEVICE_SYNC_STALE_HOURS = 72;

type ReliabilityConnection = {
  status: DeviceConnectionStatus | string;
  lastSyncedAt: Date | string | null;
  lastError: string | null;
  _count?: { readings?: number; syncJobs?: number; jobRuns?: number };
};

function ageInHours(value: Date | string | null | undefined, now: Date) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(
    0,
    Math.round((now.getTime() - date.getTime()) / 36_000) / 100,
  );
}

function formatAge(hours: number | null) {
  if (hours === null) return "never";
  if (hours < 1) return "less than 1 hour ago";
  if (hours < 24)
    return `${Math.round(hours)} hour${Math.round(hours) === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function buildDeviceReliabilitySignal(
  connection: ReliabilityConnection,
  now = new Date(),
) {
  const hoursSinceLastSync = ageInHours(connection.lastSyncedAt, now);
  const syncAgeLabel = formatAge(hoursSinceLastSync);

  if (connection.status === DeviceConnectionStatus.REVOKED) {
    return {
      tone: "danger" as const,
      label: "Revoked",
      description: "Connection has been revoked and cannot sync new readings.",
      nextStep: "Create a new device link if this source should be used again.",
      syncAgeLabel,
      hoursSinceLastSync,
      needsReview: true,
      isStale: false,
    };
  }

  if (
    connection.status === DeviceConnectionStatus.ERROR ||
    connection.lastError
  ) {
    return {
      tone: "danger" as const,
      label: "Blocked",
      description:
        connection.lastError || "Last sync reported an error and needs review.",
      nextStep:
        "Open the device detail page, review the last error, then reconnect or clear it after validation.",
      syncAgeLabel,
      hoursSinceLastSync,
      needsReview: true,
      isStale: true,
    };
  }

  if (connection.status === DeviceConnectionStatus.DISCONNECTED) {
    return {
      tone: "warning" as const,
      label: "Paused",
      description:
        "Connection is disconnected and will not accept fresh mobile/device readings.",
      nextStep:
        "Reconnect when the user confirms this device should sync again.",
      syncAgeLabel,
      hoursSinceLastSync,
      needsReview: true,
      isStale: false,
    };
  }

  if (hoursSinceLastSync === null) {
    return {
      tone: "info" as const,
      label: "Awaiting first sync",
      description:
        "Connection exists but has not submitted a reading batch yet.",
      nextStep: "Run the simulator or submit a mobile device-readings payload.",
      syncAgeLabel,
      hoursSinceLastSync,
      needsReview: false,
      isStale: false,
    };
  }

  if (hoursSinceLastSync >= DEVICE_SYNC_STALE_HOURS) {
    return {
      tone: "warning" as const,
      label: "Stale sync",
      description: `Last successful sync was ${syncAgeLabel}.`,
      nextStep:
        "Ask the device client to refresh permissions, token state, and background sync settings.",
      syncAgeLabel,
      hoursSinceLastSync,
      needsReview: true,
      isStale: true,
    };
  }

  if (hoursSinceLastSync >= DEVICE_SYNC_ATTENTION_HOURS) {
    return {
      tone: "info" as const,
      label: "Sync due",
      description: `Last successful sync was ${syncAgeLabel}.`,
      nextStep:
        "Monitor the next scheduled mobile sync or run a manual QA payload.",
      syncAgeLabel,
      hoursSinceLastSync,
      needsReview: false,
      isStale: false,
    };
  }

  return {
    tone: "success" as const,
    label: "Current",
    description: `Last successful sync was ${syncAgeLabel}.`,
    nextStep: "No action needed.",
    syncAgeLabel,
    hoursSinceLastSync,
    needsReview: false,
    isStale: false,
  };
}

export function buildConnectionReliabilitySummary(
  connections: ReliabilityConnection[],
  now = new Date(),
) {
  const signals = connections.map((connection) =>
    buildDeviceReliabilitySignal(connection, now),
  );
  return {
    current: signals.filter((signal) => signal.label === "Current").length,
    due: signals.filter((signal) => signal.label === "Sync due").length,
    stale: signals.filter((signal) => signal.label === "Stale sync").length,
    blocked: signals.filter((signal) => signal.label === "Blocked").length,
    paused: signals.filter((signal) => signal.label === "Paused").length,
    revoked: signals.filter((signal) => signal.label === "Revoked").length,
    awaitingFirstSync: signals.filter(
      (signal) => signal.label === "Awaiting first sync",
    ).length,
    needsReview: signals.filter((signal) => signal.needsReview).length,
  };
}

export function buildDeviceQaCurl(
  baseUrl = "https://your-vitavault-domain.com",
) {
  return [
    `curl -X POST ${baseUrl}/api/mobile/device-readings \\`,
    '  -H "Authorization: Bearer <mobile_token>" \\',
    '  -H "Content-Type: application/json" \\',
    `  -d '${JSON.stringify(DEVICE_QA_SAMPLE_PAYLOAD, null, 2).replaceAll("'", "'\\''")}'`,
  ].join("\n");
}

export function buildDeviceQaChecklist() {
  return [
    "Create a mobile token with /api/mobile/auth/login.",
    "POST readings to /api/mobile/device-readings using the bearer token.",
    "Confirm a DeviceConnection appears as ACTIVE.",
    "Confirm a SyncJob records requested, accepted, and mirrored counts.",
    "Confirm supported readings mirror into Vitals Monitor and Trends.",
    ...getMobileSecurityChecklist().slice(0, 4),
  ];
}

export async function getDeviceIntegrationDashboardData(userId: string) {
  const [
    connections,
    recentReadings,
    recentSyncJobs,
    mirroredVitals,
    mobileSessions,
  ] = await Promise.all([
    db.deviceConnection.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        source: true,
        platform: true,
        clientDeviceId: true,
        deviceLabel: true,
        appVersion: true,
        status: true,
        scopesJson: true,
        lastSyncedAt: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { readings: true, syncJobs: true, jobRuns: true } },
      },
    }),
    db.deviceReading.findMany({
      where: { userId },
      orderBy: { capturedAt: "desc" },
      take: 10,
      select: {
        id: true,
        connectionId: true,
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
      take: 10,
      select: {
        id: true,
        connectionId: true,
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
    db.mobileSessionToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        expiresAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    }),
  ]);
  const providerConnectors = getDeviceProviderConnectors();
  const reliabilitySummary = buildConnectionReliabilitySummary(connections);
  const connectionsWithReliability = connections.map((connection) => ({
    ...connection,
    reliability: buildDeviceReliabilitySignal(connection),
  }));
  return {
    supportedReadings: SUPPORTED_DEVICE_READINGS,
    providerConnectors,
    providerSummary: buildProviderCapabilitySummary(providerConnectors),
    qaPayload: DEVICE_QA_SAMPLE_PAYLOAD,
    qaCurl: buildDeviceQaCurl(),
    qaChecklist: buildDeviceQaChecklist(),
    connections: connectionsWithReliability,
    recentReadings,
    recentSyncJobs,
    mirroredVitals,
    mobileSessions,
    summary: {
      totalConnections: connections.length,
      activeConnections: connections.filter(
        (connection) => connection.status === DeviceConnectionStatus.ACTIVE,
      ).length,
      erroredConnections: connections.filter(
        (connection) => connection.status === DeviceConnectionStatus.ERROR,
      ).length,
      disconnectedConnections: connections.filter(
        (connection) =>
          connection.status === DeviceConnectionStatus.DISCONNECTED,
      ).length,
      revokedConnections: connections.filter(
        (connection) => connection.status === DeviceConnectionStatus.REVOKED,
      ).length,
      totalReadings: connections.reduce(
        (total, connection) => total + connection._count.readings,
        0,
      ),
      totalSyncJobs: connections.reduce(
        (total, connection) => total + connection._count.syncJobs,
        0,
      ),
      recentReadings: recentReadings.length,
      acceptedCount: recentSyncJobs.reduce(
        (total, job) => total + job.acceptedCount,
        0,
      ),
      mirroredCount: recentSyncJobs.reduce(
        (total, job) => total + job.mirroredCount,
        0,
      ),
      activeSessions: mobileSessions.filter(
        (session) => !session.revokedAt && session.expiresAt > new Date(),
      ).length,
      reliability: reliabilitySummary,
    },
  };
}

export async function getDeviceConnectionDetailData(params: {
  userId: string;
  connectionId: string;
}) {
  const connection = await db.deviceConnection.findFirst({
    where: { id: params.connectionId, userId: params.userId },
    select: {
      id: true,
      source: true,
      platform: true,
      clientDeviceId: true,
      deviceLabel: true,
      appVersion: true,
      status: true,
      scopesJson: true,
      lastSyncedAt: true,
      lastError: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { readings: true, syncJobs: true, jobRuns: true } },
    },
  });
  if (!connection) return null;
  const [readings, syncJobs, jobRuns, mirroredVitals] = await Promise.all([
    db.deviceReading.findMany({
      where: { userId: params.userId, connectionId: connection.id },
      orderBy: { capturedAt: "desc" },
      take: 25,
      select: {
        id: true,
        readingType: true,
        capturedAt: true,
        unit: true,
        valueInt: true,
        valueFloat: true,
        systolic: true,
        diastolic: true,
        metadataJson: true,
        rawPayloadJson: true,
      },
    }),
    db.syncJob.findMany({
      where: { userId: params.userId, connectionId: connection.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        status: true,
        requestedCount: true,
        acceptedCount: true,
        mirroredCount: true,
        errorMessage: true,
        metadataJson: true,
        startedAt: true,
        finishedAt: true,
        createdAt: true,
      },
    }),
    db.jobRun.findMany({
      where: { userId: params.userId, connectionId: connection.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        jobName: true,
        jobKind: true,
        status: true,
        attemptsMade: true,
        maxAttempts: true,
        errorMessage: true,
        createdAt: true,
        finishedAt: true,
      },
    }),
    db.vitalRecord.findMany({
      where: { userId: params.userId, readingSource: connection.source },
      orderBy: { recordedAt: "desc" },
      take: 10,
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
  return {
    connection,
    readings,
    syncJobs,
    jobRuns,
    mirroredVitals,
    scopes: parseScopes(connection.scopesJson),
    health: buildConnectionHealthSummary(connection),
    reliability: buildDeviceReliabilitySignal(connection),
  };
}
