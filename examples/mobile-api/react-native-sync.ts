import {
  VitaVaultMobileClient,
  VitaVaultMobileApiError,
  type VitaVaultDeviceReadingInput,
  type VitaVaultDeviceSyncPayload,
} from "./vitavault-mobile-client";

export type SecureTokenStore = {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  clearToken(): Promise<void>;
};

export type MobileReadingDraft = {
  id: string;
  kind: "heart-rate" | "blood-pressure" | "oxygen" | "weight" | "glucose" | "temperature" | "steps";
  capturedAt: Date;
  value?: number;
  systolic?: number;
  diastolic?: number;
  unit?: string;
};

export type ReactNativeSyncOptions = {
  baseUrl: string;
  tokenStore: SecureTokenStore;
  clientDeviceId: string;
  deviceLabel: string;
  appVersion: string;
};

export function mapDraftToVitaVaultReading(draft: MobileReadingDraft): VitaVaultDeviceReadingInput {
  const capturedAt = draft.capturedAt.toISOString();
  switch (draft.kind) {
    case "heart-rate":
      return { readingType: "HEART_RATE", capturedAt, clientReadingId: draft.id, unit: draft.unit ?? "bpm", valueInt: Math.round(draft.value ?? 0) };
    case "blood-pressure":
      return { readingType: "BLOOD_PRESSURE", capturedAt, clientReadingId: draft.id, unit: draft.unit ?? "mmHg", systolic: draft.systolic, diastolic: draft.diastolic };
    case "oxygen":
      return { readingType: "OXYGEN_SATURATION", capturedAt, clientReadingId: draft.id, unit: draft.unit ?? "%", valueInt: Math.round(draft.value ?? 0) };
    case "weight":
      return { readingType: "WEIGHT", capturedAt, clientReadingId: draft.id, unit: draft.unit ?? "kg", valueFloat: draft.value };
    case "glucose":
      return { readingType: "BLOOD_GLUCOSE", capturedAt, clientReadingId: draft.id, unit: draft.unit ?? "mg/dL", valueFloat: draft.value };
    case "temperature":
      return { readingType: "TEMPERATURE", capturedAt, clientReadingId: draft.id, unit: draft.unit ?? "C", valueFloat: draft.value };
    case "steps":
      return { readingType: "STEPS", capturedAt, clientReadingId: draft.id, unit: draft.unit ?? "steps", valueInt: Math.round(draft.value ?? 0) };
  }
}

export function buildReactNativeSyncPayload(options: ReactNativeSyncOptions, readings: MobileReadingDraft[]): VitaVaultDeviceSyncPayload {
  return {
    source: "ANDROID_HEALTH_CONNECT",
    platform: "ANDROID",
    clientDeviceId: options.clientDeviceId,
    deviceLabel: options.deviceLabel,
    appVersion: options.appVersion,
    scopes: ["vitals:write", "device:sync"],
    syncMetadata: { client: "react-native-example", queuedReadingCount: readings.length },
    readings: readings.map(mapDraftToVitaVaultReading),
  };
}

export async function syncQueuedReadings(options: ReactNativeSyncOptions, queuedReadings: MobileReadingDraft[]) {
  const token = await options.tokenStore.getToken();
  const client = new VitaVaultMobileClient({ baseUrl: options.baseUrl, token });
  const payload = buildReactNativeSyncPayload(options, queuedReadings);
  try {
    return await client.syncDeviceReadings(payload);
  } catch (error) {
    if (error instanceof VitaVaultMobileApiError && error.status === 401) await options.tokenStore.clearToken();
    throw error;
  }
}

export async function loginAndStoreMobileToken(options: ReactNativeSyncOptions, credentials: { email: string; password: string }) {
  const client = new VitaVaultMobileClient({ baseUrl: options.baseUrl });
  const response = await client.login({ ...credentials, deviceName: options.deviceLabel });
  await options.tokenStore.setToken(response.token);
  return response;
}
