import { ConnectionOptions } from 'bullmq';

/**
 * Builds Redis connection options from REDIS_URL.
 */
export function getRedisConnectionOptions(redisUrl: string): ConnectionOptions {
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
    enableReadyCheck: true,
    retryStrategy: (times: number) => Math.min(times * 100, 3000),
  };
}
