import crypto from "node:crypto";
import { consumeRateLimit, getClientRateLimitKey, type RateLimitResult } from "@/lib/security/rate-limit";

export type MobileEndpointKey =
  | "auth:login"
  | "auth:me"
  | "auth:logout"
  | "connections:list"
  | "readings:sync";

export type MobileEndpointSecurityPolicy = {
  endpoint: MobileEndpointKey;
  label: string;
  limit: number;
  windowMs: number;
  maxContentLengthBytes?: number;
};

export const MOBILE_API_SECURITY_POLICIES: Record<MobileEndpointKey, MobileEndpointSecurityPolicy> = {
  "auth:login": {
    endpoint: "auth:login",
    label: "Mobile login",
    limit: 10,
    windowMs: 15 * 60 * 1000,
    maxContentLengthBytes: 16 * 1024,
  },
  "auth:me": {
    endpoint: "auth:me",
    label: "Mobile session check",
    limit: 120,
    windowMs: 15 * 60 * 1000,
  },
  "auth:logout": {
    endpoint: "auth:logout",
    label: "Mobile logout",
    limit: 30,
    windowMs: 15 * 60 * 1000,
  },
  "connections:list": {
    endpoint: "connections:list",
    label: "Device connection list",
    limit: 120,
    windowMs: 15 * 60 * 1000,
  },
  "readings:sync": {
    endpoint: "readings:sync",
    label: "Device reading sync",
    limit: 60,
    windowMs: 15 * 60 * 1000,
    maxContentLengthBytes: 256 * 1024,
  },
};

export function getMobileSecurityPolicy(endpoint: MobileEndpointKey) {
  return MOBILE_API_SECURITY_POLICIES[endpoint];
}

export function getMobileRateLimitScope(endpoint: MobileEndpointKey, discriminator?: string | null) {
  const cleanDiscriminator = discriminator?.trim().toLowerCase() || "anonymous";
  return `mobile-api:${endpoint}:${cleanDiscriminator}`;
}

export function consumeMobileApiRateLimit(params: {
  request: Request;
  endpoint: MobileEndpointKey;
  discriminator?: string | null;
  now?: Date;
}) {
  const policy = getMobileSecurityPolicy(params.endpoint);
  const key = getClientRateLimitKey(
    params.request,
    getMobileRateLimitScope(params.endpoint, params.discriminator)
  );

  return consumeRateLimit({
    key,
    limit: policy.limit,
    windowMs: policy.windowMs,
    now: params.now,
  });
}

export function getMobileRateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": result.resetAt.toISOString(),
  };
}

export function getMobileRateLimitErrorBody(result: RateLimitResult, label = "mobile API") {
  return {
    error: `Too many ${label} requests. Try again later.`,
    retryAfterSeconds: result.retryAfterSeconds,
  };
}

export function getRetryAfterHeaders(result: RateLimitResult) {
  return {
    ...getMobileRateLimitHeaders(result),
    "Retry-After": String(result.retryAfterSeconds),
  };
}

export function getMobileNoStoreHeaders(extra?: Record<string, string>) {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extra,
  };
}

export function getMobileRequestContentLength(request: Request) {
  const raw = request.headers.get("content-length");
  if (!raw) {
    return null;
  }

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function isMobileRequestTooLarge(request: Request, endpoint: MobileEndpointKey) {
  const policy = getMobileSecurityPolicy(endpoint);
  const contentLength = getMobileRequestContentLength(request);

  if (!policy.maxContentLengthBytes || contentLength == null) {
    return false;
  }

  return contentLength > policy.maxContentLengthBytes;
}

export function getMobilePayloadTooLargeBody(endpoint: MobileEndpointKey) {
  const policy = getMobileSecurityPolicy(endpoint);
  return {
    error: "Mobile API payload is too large.",
    maxContentLengthBytes: policy.maxContentLengthBytes ?? null,
  };
}

export function fingerprintBearerToken(token: string | null | undefined) {
  if (!token?.trim()) {
    return null;
  }

  return crypto.createHash("sha256").update(token.trim()).digest("hex").slice(0, 16);
}

export function getMobileAuditMetadata(request: Request, extra?: Record<string, unknown>) {
  const userAgent = request.headers.get("user-agent") ?? null;
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const realIp = request.headers.get("x-real-ip")?.trim() ?? null;
  const cfIp = request.headers.get("cf-connecting-ip")?.trim() ?? null;

  return {
    channel: "mobile_api",
    userAgent,
    ipHint: forwardedFor || realIp || cfIp || null,
    ...extra,
  };
}

export function getMobileSecurityChecklist() {
  return [
    "Credential login is rate limited by email and client IP.",
    "Bearer-token endpoints are rate limited by endpoint and client IP.",
    "Large sync payloads are rejected before JSON parsing when Content-Length is available.",
    "Mobile responses include no-store and nosniff headers.",
    "Mobile session creation and revocation are written to the audit timeline.",
    "Device reading payloads still validate against the schema-backed reading contract.",
  ];
}
