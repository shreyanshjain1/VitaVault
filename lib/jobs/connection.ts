export function hasRedisConfig() {
  return Boolean(process.env.REDIS_URL?.trim());
}

export function getRedisConnection() {
  if (!hasRedisConfig()) {
    throw new Error("REDIS_URL is not configured.");
  }

  return {
    url: process.env.REDIS_URL!.trim(),
  };
}
