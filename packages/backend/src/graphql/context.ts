import { Request } from 'express'
import { Pool } from 'pg'
import { createLoaders } from './dataloaders'
import { JwtPayload } from '@auth/types'

export interface ApolloContext {
  companyId: string
  userId: string
  role: string
  authenticated: boolean
  loaders: ReturnType<typeof createLoaders>
  pool: Pool
}

export function buildContext(pool: Pool) {
  return ({ req }: { req: Request }): ApolloContext => {
    const auth = req.auth as JwtPayload | undefined
    return {
      companyId: auth?.companyId ?? '',
      userId: auth?.userId ?? '',
      role: auth?.role ?? '',
      authenticated: !!auth,
      loaders: createLoaders(pool, auth?.companyId ?? ''),
      pool,
    }
  }
}
