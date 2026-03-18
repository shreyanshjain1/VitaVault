export function getRedisConnection() {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not configured.");
  }

  return {
    url: process.env.REDIS_URL,
  };
}