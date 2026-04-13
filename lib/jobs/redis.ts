import IORedis from "ioredis";
import { hasRedisConfig } from "@/lib/jobs/connection";

declare global {
  // eslint-disable-next-line no-var
  var vitavaultBullRedis: IORedis | undefined;
}

function createRedisConnection() {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    throw new Error("REDIS_URL is not configured.");
  }

  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
  });
}

export function getBullmqRedisConnection() {
  if (!hasRedisConfig()) {
    throw new Error("REDIS_URL is not configured.");
  }

  if (!globalThis.vitavaultBullRedis) {
    globalThis.vitavaultBullRedis = createRedisConnection();
  }

  return globalThis.vitavaultBullRedis;
}
