import {
  DevicePlatform,
  DeviceReadingType,
  ReadingSource,
} from "@prisma/client";

export type DeviceConnectorStatus = "ready" | "simulated" | "planned";
export type DeviceConnectorCategory = "phone_health_platform" | "wearable" | "smart_device" | "manual_or_custom";

export type DeviceProviderConnector = {
  source: ReadingSource;
  label: string;
  shortLabel: string;
  category: DeviceConnectorCategory;
  status: DeviceConnectorStatus;
  platformHints: DevicePlatform[];
  authModel: string;
  supportedReadings: DeviceReadingType[];
  requiredScopes: string[];
  normalizedFields: string[];
  setupSteps: string[];
  limitations: string[];
};

export const DEVICE_PROVIDER_CONNECTORS: DeviceProviderConnector[] = [
  {
    source: ReadingSource.ANDROID_HEALTH_CONNECT,
    label: "Android Health Connect",
    shortLabel: "Health Connect",
    category: "phone_health_platform",
    status: "ready",
    platformHints: [DevicePlatform.ANDROID],
    authModel: "Mobile bearer token plus Android-side Health Connect permission grant.",
    supportedReadings: [
      DeviceReadingType.STEPS,
      DeviceReadingType.HEART_RATE,
      DeviceReadingType.BLOOD_PRESSURE,
      DeviceReadingType.OXYGEN_SATURATION,
      DeviceReadingType.WEIGHT,
      DeviceReadingType.BLOOD_GLUCOSE,
      DeviceReadingType.TEMPERATURE,
    ],
    requiredScopes: ["vitals:write", "device:sync", "health-connect:read"],
    normalizedFields: ["clientDeviceId", "readingType", "capturedAt", "unit", "valueInt/valueFloat", "systolic/diastolic"],
    setupSteps: [
      "Request Health Connect permissions in the Android client.",
      "Login through /api/mobile/auth/login and store the returned mobile token securely.",
      "Normalize Health Connect records into VitaVault reading payloads.",
      "POST batches to /api/mobile/device-readings and inspect sync job results.",
    ],
    limitations: [
      "The repository includes the API contract and normalization target, not a native Android APK module.",
      "Sleep records are intentionally excluded until the Prisma reading enum supports them.",
    ],
  },
  {
    source: ReadingSource.APPLE_HEALTH,
    label: "Apple HealthKit",
    shortLabel: "Apple Health",
    category: "phone_health_platform",
    status: "simulated",
    platformHints: [DevicePlatform.IOS],
    authModel: "Mobile bearer token plus iOS HealthKit permission grant.",
    supportedReadings: [
      DeviceReadingType.STEPS,
      DeviceReadingType.HEART_RATE,
      DeviceReadingType.BLOOD_PRESSURE,
      DeviceReadingType.OXYGEN_SATURATION,
      DeviceReadingType.WEIGHT,
      DeviceReadingType.BLOOD_GLUCOSE,
      DeviceReadingType.TEMPERATURE,
    ],
    requiredScopes: ["vitals:write", "device:sync", "healthkit:read"],
    normalizedFields: ["clientDeviceId", "readingType", "capturedAt", "unit", "valueInt/valueFloat", "systolic/diastolic"],
    setupSteps: [
      "Request HealthKit authorization in the iOS client.",
      "Map HKQuantity samples into VitaVault reading types.",
      "Submit batches with a VitaVault mobile bearer token.",
      "Review accepted and mirrored counts in Device Integrations.",
    ],
    limitations: [
      "Native HealthKit collection is represented as an adapter contract, not an included Swift app.",
      "Provider-specific background delivery must be implemented in a native client.",
    ],
  },
  {
    source: ReadingSource.FITBIT,
    label: "Fitbit OAuth Connector",
    shortLabel: "Fitbit",
    category: "wearable",
    status: "planned",
    platformHints: [DevicePlatform.WEB, DevicePlatform.OTHER],
    authModel: "Future OAuth connector that exchanges provider tokens before normalizing readings.",
    supportedReadings: [
      DeviceReadingType.STEPS,
      DeviceReadingType.HEART_RATE,
      DeviceReadingType.WEIGHT,
      DeviceReadingType.OXYGEN_SATURATION,
    ],
    requiredScopes: ["activity", "heartrate", "weight", "oxygen_saturation"],
    normalizedFields: ["providerUserId", "readingType", "capturedAt", "unit", "valueInt/valueFloat"],
    setupSteps: [
      "Create a provider OAuth app.",
      "Store encrypted provider refresh tokens.",
      "Pull activity and health summaries through scheduled sync jobs.",
      "Normalize provider responses into VitaVault device readings.",
    ],
    limitations: [
      "OAuth token storage is intentionally not implemented in this portfolio version.",
      "Provider API access requires external Fitbit developer configuration.",
    ],
  },
  {
    source: ReadingSource.SMART_BP_MONITOR,
    label: "Smart Blood Pressure Monitor",
    shortLabel: "BP Monitor",
    category: "smart_device",
    status: "ready",
    platformHints: [DevicePlatform.ANDROID, DevicePlatform.IOS, DevicePlatform.OTHER],
    authModel: "Mobile bearer token from a companion app or gateway device.",
    supportedReadings: [DeviceReadingType.BLOOD_PRESSURE, DeviceReadingType.HEART_RATE],
    requiredScopes: ["vitals:write", "device:sync", "bp:read"],
    normalizedFields: ["systolic", "diastolic", "heartRate", "capturedAt", "unit"],
    setupSteps: [
      "Pair the monitor with a companion app or local gateway.",
      "Convert readings to BLOOD_PRESSURE and HEART_RATE payloads.",
      "Submit each measurement with a stable clientReadingId.",
      "Review mirrored vitals and sync job status after ingestion.",
    ],
    limitations: [
      "Bluetooth pairing is outside the web app scope.",
      "Clinical calibration and device certification are not part of this demo.",
    ],
  },
  {
    source: ReadingSource.SMART_SCALE,
    label: "Smart Scale",
    shortLabel: "Scale",
    category: "smart_device",
    status: "ready",
    platformHints: [DevicePlatform.ANDROID, DevicePlatform.IOS, DevicePlatform.OTHER],
    authModel: "Mobile bearer token from a companion app or imported scale export.",
    supportedReadings: [DeviceReadingType.WEIGHT],
    requiredScopes: ["vitals:write", "device:sync", "weight:read"],
    normalizedFields: ["valueFloat", "unit", "capturedAt", "clientReadingId"],
    setupSteps: [
      "Pair the scale with a mobile app or import source.",
      "Normalize weight to kilograms or preserve the submitted unit.",
      "Submit readings to /api/mobile/device-readings.",
      "Confirm the reading appears in Vitals Monitor and Trends.",
    ],
    limitations: [
      "Body composition metrics are not modeled yet.",
      "Multi-user household scale matching is a future adapter concern.",
    ],
  },
  {
    source: ReadingSource.PULSE_OXIMETER,
    label: "Pulse Oximeter",
    shortLabel: "Oximeter",
    category: "smart_device",
    status: "ready",
    platformHints: [DevicePlatform.ANDROID, DevicePlatform.IOS, DevicePlatform.OTHER],
    authModel: "Mobile bearer token from a companion app or BLE gateway.",
    supportedReadings: [DeviceReadingType.OXYGEN_SATURATION, DeviceReadingType.HEART_RATE],
    requiredScopes: ["vitals:write", "device:sync", "spo2:read"],
    normalizedFields: ["valueInt", "unit", "capturedAt", "clientReadingId"],
    setupSteps: [
      "Pair the oximeter with a companion app or gateway.",
      "Normalize SpO2 to OXYGEN_SATURATION and pulse to HEART_RATE.",
      "Send readings with stable client identifiers.",
      "Review mirrored vitals and any alert thresholds triggered later.",
    ],
    limitations: [
      "Continuous waveform data is not stored.",
      "Alarm-grade monitoring is outside the app scope.",
    ],
  },
  {
    source: ReadingSource.OTHER,
    label: "Custom / Manual Device Source",
    shortLabel: "Custom",
    category: "manual_or_custom",
    status: "simulated",
    platformHints: [DevicePlatform.WEB, DevicePlatform.OTHER],
    authModel: "Mobile bearer token or internal QA tooling.",
    supportedReadings: [
      DeviceReadingType.STEPS,
      DeviceReadingType.HEART_RATE,
      DeviceReadingType.BLOOD_PRESSURE,
      DeviceReadingType.OXYGEN_SATURATION,
      DeviceReadingType.WEIGHT,
      DeviceReadingType.BLOOD_GLUCOSE,
      DeviceReadingType.TEMPERATURE,
    ],
    requiredScopes: ["vitals:write", "device:sync"],
    normalizedFields: ["source", "platform", "clientDeviceId", "readingType", "capturedAt", "value fields"],
    setupSteps: [
      "Choose a stable clientDeviceId for the external source.",
      "Map external records into supported VitaVault reading types.",
      "Submit batches to the mobile device readings endpoint.",
      "Use Device Integrations to inspect sync jobs and rejected values.",
    ],
    limitations: [
      "Custom provider semantics must be documented by the integrating client.",
      "Unsupported reading categories require schema and migration work first.",
    ],
  },
];

export function getDeviceProviderConnectors() {
  return DEVICE_PROVIDER_CONNECTORS;
}

export function getDeviceProviderConnector(source: ReadingSource | string) {
  return DEVICE_PROVIDER_CONNECTORS.find((connector) => connector.source === source) ?? null;
}

export function connectorStatusLabel(status: DeviceConnectorStatus) {
  if (status === "ready") return "API-ready";
  if (status === "simulated") return "Adapter contract";
  return "Planned provider";
}

export function connectorCategoryLabel(category: DeviceConnectorCategory) {
  if (category === "phone_health_platform") return "Phone health platform";
  if (category === "wearable") return "Wearable provider";
  if (category === "smart_device") return "Smart device";
  return "Custom/manual source";
}

export function buildProviderCapabilitySummary(connectors = DEVICE_PROVIDER_CONNECTORS) {
  const sources = new Set(connectors.map((connector) => connector.source));
  const supportedReadings = new Set(connectors.flatMap((connector) => connector.supportedReadings));

  return {
    totalConnectors: connectors.length,
    readyConnectors: connectors.filter((connector) => connector.status === "ready").length,
    simulatedConnectors: connectors.filter((connector) => connector.status === "simulated").length,
    plannedConnectors: connectors.filter((connector) => connector.status === "planned").length,
    uniqueSources: sources.size,
    supportedReadingTypes: supportedReadings.size,
  };
}

export function buildProviderSamplePayload(source: ReadingSource) {
  const connector = getDeviceProviderConnector(source);
  const readingType = connector?.supportedReadings[0] ?? DeviceReadingType.HEART_RATE;
  const platform = connector?.platformHints[0] ?? DevicePlatform.OTHER;

  const base = {
    source,
    platform,
    clientDeviceId: `${source.toLowerCase().replaceAll("_", "-")}-demo-device`,
    deviceLabel: connector?.label ?? "Demo device",
    appVersion: "1.0.0",
    scopes: connector?.requiredScopes.slice(0, 3) ?? ["vitals:write", "device:sync"],
    syncMetadata: {
      adapter: connector?.shortLabel ?? source,
      importMode: "provider-adapter-preview",
    },
  };

  if (readingType === DeviceReadingType.BLOOD_PRESSURE) {
    return {
      ...base,
      readings: [
        {
          readingType,
          capturedAt: "2026-05-08T08:35:00.000Z",
          clientReadingId: `${source.toLowerCase()}-bp-001`,
          unit: "mmHg",
          systolic: 118,
          diastolic: 76,
        },
      ],
    };
  }

  if (readingType === DeviceReadingType.WEIGHT || readingType === DeviceReadingType.BLOOD_GLUCOSE || readingType === DeviceReadingType.TEMPERATURE) {
    return {
      ...base,
      readings: [
        {
          readingType,
          capturedAt: "2026-05-08T08:35:00.000Z",
          clientReadingId: `${source.toLowerCase()}-${readingType.toLowerCase()}-001`,
          unit: readingType === DeviceReadingType.WEIGHT ? "kg" : readingType === DeviceReadingType.TEMPERATURE ? "°C" : "mg/dL",
          valueFloat: readingType === DeviceReadingType.WEIGHT ? 71.4 : readingType === DeviceReadingType.TEMPERATURE ? 36.7 : 96,
        },
      ],
    };
  }

  return {
    ...base,
    readings: [
      {
        readingType,
        capturedAt: "2026-05-08T08:35:00.000Z",
        clientReadingId: `${source.toLowerCase()}-${readingType.toLowerCase()}-001`,
        unit: readingType === DeviceReadingType.HEART_RATE ? "bpm" : readingType === DeviceReadingType.OXYGEN_SATURATION ? "%" : "count",
        valueInt: readingType === DeviceReadingType.HEART_RATE ? 78 : readingType === DeviceReadingType.OXYGEN_SATURATION ? 98 : 8420,
      },
    ],
  };
}

export function getProviderSetupChecklist(source: ReadingSource | string) {
  const connector = getDeviceProviderConnector(source);
  if (!connector) {
    return [
      "Confirm the source is supported by the Prisma ReadingSource enum.",
      "Map external readings into the mobile device-readings payload.",
      "Submit a QA payload and review the resulting sync job.",
    ];
  }

  return connector.setupSteps;
}
