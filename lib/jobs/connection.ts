import IORedis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __vitavaultRedis__: IORedis | undefined;
}

export function getRedisConnection() {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not configured.");
  }

  if (!global.__vitavaultRedis__) {
    global.__vitavaultRedis__ = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  return global.__vitavaultRedis__;
}
