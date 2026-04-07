export interface JwtPayload {
  userId: string
  companyId: string
  companySlug: string
  role: string
  iat?: number
  exp?: number
}

// Extend Express Request to carry auth context
declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload
    }
  }
}
