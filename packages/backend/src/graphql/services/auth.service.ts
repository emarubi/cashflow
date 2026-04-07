import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import { Redis } from 'ioredis'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@auth/jwt'
import { UserRow } from '@graphql/dataloaders'

interface AuthResult {
  accessToken: string
  user: UserRow
}

export class AuthService {
  constructor(private pool: Pool, private redis: Redis) {}

  async login(email: string, password: string, companySlug: string): Promise<AuthResult> {
    const { rows } = await this.pool.query<UserRow & { password_hash: string; company_slug: string }>(
      `SELECT u.id, u.company_id, u.email, u.name, u.role, u.password_hash,
              u.created_at, u.updated_at, c.slug AS company_slug
       FROM users u
       JOIN companies c ON c.id = u.company_id
       WHERE u.email = $1 AND c.slug = $2`,
      [email, companySlug],
    )
    if (rows.length === 0) throw new Error('Invalid credentials')

    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) throw new Error('Invalid credentials')

    const payload = {
      userId: user.id,
      companyId: user.company_id,
      companySlug: user.company_slug,
      role: user.role,
    }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)
    await this.redis.set(`refresh:${user.id}`, refreshToken, 'EX', 60 * 60 * 24 * 7)

    const { password_hash: _ph, company_slug: _cs, ...userRow } = user
    return { accessToken, user: userRow as UserRow }
  }

  async refreshToken(token: string): Promise<AuthResult> {
    const payload = verifyRefreshToken(token)
    const stored = await this.redis.get(`refresh:${payload.userId}`)
    if (stored !== token) throw new Error('Invalid refresh token')

    const { rows } = await this.pool.query<UserRow & { company_slug: string }>(
      `SELECT u.id, u.company_id, u.email, u.name, u.role, u.created_at, u.updated_at, c.slug AS company_slug
       FROM users u JOIN companies c ON c.id = u.company_id
       WHERE u.id = $1 AND u.company_id = $2`,
      [payload.userId, payload.companyId],
    )
    if (rows.length === 0) throw new Error('User not found')

    const user = rows[0]
    const newPayload = {
      userId: user.id,
      companyId: user.company_id,
      companySlug: user.company_slug,
      role: user.role,
    }
    const accessToken = signAccessToken(newPayload)
    const newRefresh = signRefreshToken(newPayload)
    await this.redis.del(`refresh:${user.id}`)
    await this.redis.set(`refresh:${user.id}`, newRefresh, 'EX', 60 * 60 * 24 * 7)

    const { company_slug: _cs, ...userRow } = user
    return { accessToken, user: userRow as UserRow }
  }

  async logout(userId: string): Promise<void> {
    await this.redis.del(`refresh:${userId}`)
  }
}
