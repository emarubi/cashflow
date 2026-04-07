import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from './jwt'

// /graphql is intentionally not blocked here — resolvers enforce auth via context
const PUBLIC_PATHS = ['/auth/login', '/auth/refresh', '/health', '/graphql']

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      req.auth = verifyAccessToken(header.slice(7))
    } catch {
      // Invalid token — leave req.auth undefined; resolvers / route handlers decide
    }
  }

  if (PUBLIC_PATHS.includes(req.path)) {
    return next()
  }

  if (!req.auth) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' })
    return
  }

  next()
}
