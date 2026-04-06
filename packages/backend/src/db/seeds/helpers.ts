import { randomUUID } from 'crypto'
import { Pool, PoolClient } from 'pg'
import bcrypt from 'bcryptjs'
import { faker } from '@faker-js/faker'

faker.seed(42)
export { faker }

export const uuid = (): string => randomUUID()

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Inserts rows in chunks, returns all returned column values if `returning` is provided
export async function batchInsert(
  client: PoolClient,
  table: string,
  columns: string[],
  rows: unknown[][],
  returning?: string,
  chunkSize = 500,
): Promise<string[]> {
  const ids: string[] = []
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const values: unknown[] = []
    const placeholders = chunk.map((row, rowIdx) => {
      const params = row.map((val, colIdx) => {
        values.push(val)
        return `$${rowIdx * columns.length + colIdx + 1}`
      })
      return `(${params.join(', ')})`
    })
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')}${returning ? ` RETURNING ${returning}` : ''}`
    const result = await client.query(sql, values)
    if (returning) {
      ids.push(...result.rows.map((r) => r[returning] as string))
    }
  }
  return ids
}

// Randomly pick n items from an array
export function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

export function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Returns a random date between `start` and `end`
export function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}
