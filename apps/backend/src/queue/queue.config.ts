import { ConnectionOptions } from 'bullmq';

/**
 * Builds Redis connection options from REDIS_URL.
 *
 * @param redisUrl - The Redis connection string
 * @param limitRetries - When true, stop retrying after 3 attempts (dev mode)
 */
export function getRedisConnectionOptions(
  redisUrl: string,
  limitRetries = false,
): ConnectionOptions {
  const parsed = new URL(redisUrl);
  const dbPath = parsed.pathname.replace('/', '').trim();
  const db = dbPath.length > 0 ? parseInt(dbPath, 10) : 0;
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379', 10),
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db: Number.isNaN(db) ? 0 : db,
    maxRetriesPerRequest: null,
    enableReadyCheck: !limitRetries,
    lazyConnect: limitRetries,
    retryStrategy: (times: number) => {
      if (limitRetries && times > 1) return null;
      return Math.min(times * 100, 3000);
    },
  };
}
