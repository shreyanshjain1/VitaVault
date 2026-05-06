export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

function nowMs() {
  return Date.now();
}

function cleanupExpiredBuckets(current = nowMs()) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= current) {
      buckets.delete(key);
    }
  }
}

export function consumeRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
  now?: Date;
}): RateLimitResult {
  const current = params.now?.getTime() ?? nowMs();
  cleanupExpiredBuckets(current);

  const existing = buckets.get(params.key);
  const bucket =
    existing && existing.resetAt > current
      ? existing
      : { count: 0, resetAt: current + params.windowMs };

  bucket.count += 1;
  buckets.set(params.key, bucket);

  const allowed = bucket.count <= params.limit;
  const remaining = Math.max(0, params.limit - bucket.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - current) / 1000));

  return {
    allowed,
    limit: params.limit,
    remaining,
    resetAt: new Date(bucket.resetAt),
    retryAfterSeconds,
  };
}

export function getClientRateLimitKey(request: Request, scope: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  const ip = forwardedFor || realIp || cfIp || "unknown";
  return `${scope}:${ip}`;
}

export function resetRateLimitBucketsForTests() {
  buckets.clear();
}
