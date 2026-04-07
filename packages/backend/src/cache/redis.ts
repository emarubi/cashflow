import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6380'

// General-purpose Redis client (caching, idempotency keys)
export const redis = new Redis(redisUrl)

// BullMQ requires maxRetriesPerRequest: null for blocking commands
export function createBullMQConnection(): Redis {
  return new Redis(redisUrl, { maxRetriesPerRequest: null })
}
