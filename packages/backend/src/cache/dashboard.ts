import { redis } from './redis'

const TTL = 300 // 5 minutes

function key(companyId: string): string {
  return `dashboard:${companyId}`
}

export async function getDashboardCache(companyId: string): Promise<unknown | null> {
  const raw = await redis.get(key(companyId))
  return raw ? (JSON.parse(raw) as unknown) : null
}

export async function setDashboardCache(companyId: string, data: unknown): Promise<void> {
  await redis.set(key(companyId), JSON.stringify(data), 'EX', TTL)
}

export async function invalidateDashboardCache(companyId: string): Promise<void> {
  await redis.del(key(companyId))
}
