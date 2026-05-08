export type VitaVaultReadingType =
  | "HEART_RATE"
  | "BLOOD_PRESSURE"
  | "OXYGEN_SATURATION"
  | "WEIGHT"
  | "BLOOD_GLUCOSE"
  | "TEMPERATURE"
  | "STEPS";

export type VitaVaultReadingSource =
  | "MANUAL"
  | "ANDROID_HEALTH_CONNECT"
  | "APPLE_HEALTH"
  | "FITBIT"
  | "SMART_BP_MONITOR"
  | "SMART_SCALE"
  | "PULSE_OXIMETER"
  | "OTHER";

export type VitaVaultDevicePlatform = "ANDROID" | "IOS" | "WEB" | "WEARABLE" | "BLUETOOTH" | "OTHER";
export type VitaVaultConnectionStatus = "ACTIVE" | "ERROR" | "REVOKED" | "DISCONNECTED";

export type VitaVaultUser = { id: string; email: string; name: string | null };
export type VitaVaultLoginResponse = { token: string; expiresAt: string; user: VitaVaultUser };

export type VitaVaultConnection = {
  id: string;
  source: VitaVaultReadingSource;
  platform: VitaVaultDevicePlatform;
  clientDeviceId: string;
  deviceLabel: string | null;
  appVersion: string | null;
  status: VitaVaultConnectionStatus;
  lastSyncedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VitaVaultDeviceReadingInput = {
  readingType: VitaVaultReadingType;
  capturedAt: string;
  clientReadingId?: string;
  unit?: string;
  valueInt?: number;
  valueFloat?: number;
  systolic?: number;
  diastolic?: number;
  metadata?: Record<string, unknown>;
  rawPayload?: Record<string, unknown>;
};

export type VitaVaultDeviceSyncPayload = {
  source: VitaVaultReadingSource;
  platform: VitaVaultDevicePlatform;
  clientDeviceId: string;
  deviceLabel?: string;
  appVersion?: string;
  scopes?: string[];
  syncMetadata?: Record<string, unknown>;
  readings: VitaVaultDeviceReadingInput[];
};

export type VitaVaultDeviceSyncResponse = {
  success: true;
  connection: {
    id: string;
    source: VitaVaultReadingSource;
    platform: VitaVaultDevicePlatform;
    clientDeviceId: string;
    deviceLabel: string | null;
    status: VitaVaultConnectionStatus;
  };
  sync: {
    syncJobId: string;
    requestedCount: number;
    acceptedCount: number;
    mirroredCount: number;
    duplicateCount: number;
  };
};

export type VitaVaultApiError = { error: string; details?: unknown; retryAfterSeconds?: number };
export type VitaVaultRateLimitInfo = { limit: number | null; remaining: number | null; resetAt: string | null; retryAfterSeconds: number | null };

export class VitaVaultMobileApiError extends Error {
  readonly status: number;
  readonly body: VitaVaultApiError | null;
  readonly rateLimit: VitaVaultRateLimitInfo;

  constructor(params: { status: number; body: VitaVaultApiError | null; rateLimit: VitaVaultRateLimitInfo }) {
    super(params.body?.error ?? `VitaVault mobile API request failed with status ${params.status}`);
    this.name = "VitaVaultMobileApiError";
    this.status = params.status;
    this.body = params.body;
    this.rateLimit = params.rateLimit;
  }
}

export type VitaVaultMobileClientOptions = { baseUrl: string; token?: string | null; fetchImpl?: typeof fetch };

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function parseIntegerHeader(headers: Headers, name: string) {
  const value = headers.get(name);
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getRateLimitInfo(headers: Headers): VitaVaultRateLimitInfo {
  return {
    limit: parseIntegerHeader(headers, "x-ratelimit-limit"),
    remaining: parseIntegerHeader(headers, "x-ratelimit-remaining"),
    resetAt: headers.get("x-ratelimit-reset"),
    retryAfterSeconds: parseIntegerHeader(headers, "retry-after"),
  };
}

async function readJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function asApiError(value: unknown): VitaVaultApiError | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  return {
    error: typeof record.error === "string" ? record.error : "Unknown VitaVault mobile API error.",
    details: record.details,
    retryAfterSeconds: typeof record.retryAfterSeconds === "number" ? record.retryAfterSeconds : undefined,
  };
}

export class VitaVaultMobileClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private token: string | null;

  constructor(options: VitaVaultMobileClientOptions) {
    this.baseUrl = trimTrailingSlash(options.baseUrl);
    this.token = options.token ?? null;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  async login(params: { email: string; password: string; deviceName?: string }) {
    const response = await this.request<VitaVaultLoginResponse>("/api/mobile/auth/login", { method: "POST", body: params, auth: false });
    this.token = response.token;
    return response;
  }

  async getCurrentUser() {
    return this.request<{ user: VitaVaultUser }>("/api/mobile/auth/me", { method: "GET", auth: true });
  }

  async logout() {
    const response = await this.request<{ success: true }>("/api/mobile/auth/logout", { method: "POST", auth: true });
    this.token = null;
    return response;
  }

  async listConnections() {
    return this.request<{ connections: VitaVaultConnection[] }>("/api/mobile/connections", { method: "GET", auth: true });
  }

  async syncDeviceReadings(payload: VitaVaultDeviceSyncPayload) {
    return this.request<VitaVaultDeviceSyncResponse>("/api/mobile/device-readings", { method: "POST", body: payload, auth: true });
  }

  private async request<T>(path: string, options: { method: "GET" | "POST"; auth: boolean; body?: unknown }): Promise<T> {
    const headers = new Headers({ Accept: "application/json" });
    if (options.body !== undefined) headers.set("Content-Type", "application/json");
    if (options.auth) {
      if (!this.token) throw new Error("Missing VitaVault mobile bearer token.");
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: options.method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const json = await readJsonSafely(response);
    if (!response.ok) {
      throw new VitaVaultMobileApiError({ status: response.status, body: asApiError(json), rateLimit: getRateLimitInfo(response.headers) });
    }
    return json as T;
  }
}

export function buildAndroidHealthConnectSamplePayload(now = new Date()): VitaVaultDeviceSyncPayload {
  const capturedAt = now.toISOString();
  return {
    source: "ANDROID_HEALTH_CONNECT",
    platform: "ANDROID",
    clientDeviceId: "android-pixel-8-pro",
    deviceLabel: "Pixel 8 Pro",
    appVersion: "1.0.0",
    scopes: ["vitals:write", "device:sync"],
    syncMetadata: { transport: "health-connect-sample", network: "wifi" },
    readings: [
      { readingType: "HEART_RATE", capturedAt, clientReadingId: `hr-${now.getTime()}`, unit: "bpm", valueInt: 78 },
      { readingType: "BLOOD_PRESSURE", capturedAt, clientReadingId: `bp-${now.getTime()}`, unit: "mmHg", systolic: 118, diastolic: 76 },
      { readingType: "WEIGHT", capturedAt, clientReadingId: `weight-${now.getTime()}`, unit: "kg", valueFloat: 71.4 },
    ],
  };
}
