import IORedis from "ioredis";

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

export const bullmqConnection =
  globalThis.vitavaultBullRedis ?? createRedisConnection();

if (process.env.NODE_ENV !== "production") {
  globalThis.vitavaultBullRedis = bullmqConnection;
}