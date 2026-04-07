import { Router, Request, Response } from 'express'
import { AuthService } from '@graphql/services/auth.service'
import { pool } from '@db/pool'
import { redis } from '@cache/redis'

const router = Router()
const authService = new AuthService(pool, redis)

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, companySlug } = req.body as { email: string; password: string; companySlug: string }
    if (!email || !password || !companySlug) {
      res.status(400).json({ error: 'email, password and companySlug are required' })
      return
    }
    const result = await authService.login(email, password, companySlug)
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed'
    res.status(401).json({ error: message })
  }
})

router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body as { token: string }
    if (!token) {
      res.status(400).json({ error: 'token is required' })
      return
    }
    const result = await authService.refreshToken(token)
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Refresh failed'
    res.status(401).json({ error: message })
  }
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId
    if (userId) {
      await authService.logout(userId)
    }
    res.json({ ok: true })
  } catch {
    res.json({ ok: true })
  }
})

export { router as authRouter }
