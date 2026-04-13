export function hasRedisConfig() {
  return Boolean(process.env.REDIS_URL?.trim());
}

export function shouldSkipRedisDuringBuild() {
  return (
    process.env.SKIP_REDIS_DURING_BUILD === "1" ||
    process.env.npm_lifecycle_event === "build"
  );
}

export function getRedisConnection() {
  if (!hasRedisConfig()) {
    throw new Error("REDIS_URL is not configured.");
  }

  return {
    url: process.env.REDIS_URL!.trim(),
  };
}
