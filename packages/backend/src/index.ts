import 'dotenv/config'
import express from 'express'
import http from 'http'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { readFileSync } from 'fs'
import { join } from 'path'
import { pool } from '@db/pool'
import { authMiddleware } from '@auth/middleware'
import { authRouter } from '@auth/routes'
import { resolvers } from '@graphql/resolvers'
import { buildContext, ApolloContext } from '@graphql/context'
import { startScheduler } from '@queues/dunning.scheduler'
import { dunningWorker } from '@queues/dunning.worker'

const typeDefs = readFileSync(join(__dirname, 'graphql/schema.graphql'), 'utf8')

async function main(): Promise<void> {
  const app = express()
  const httpServer = http.createServer(app)

  const server = new ApolloServer<ApolloContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  })

  await server.start()

  app.use(express.json())
  app.use(authMiddleware)

  // Health check
  app.get('/health', (_req, res) => res.json({ status: 'ok' }))

  // Auth REST routes
  app.use('/auth', authRouter)

  // GraphQL endpoint
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async (args) => buildContext(pool)(args),
    }),
  )

  const PORT = parseInt(process.env.PORT ?? '4000', 10)
  await new Promise<void>((resolve) => httpServer.listen(PORT, resolve))
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`)

  // Start BullMQ scheduler and worker
  startScheduler()
  console.log(`[WORKER] Dunning worker started (concurrency=5)`)
  console.log(`Worker status: ${dunningWorker.isRunning() ? 'running' : 'idle'}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
