import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'

const app = Fastify({
  logger: {
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
})

// ── Plugins ────────────────────────────────────────────────────────────────
await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
})

// ── Routes ─────────────────────────────────────────────────────────────────
const { authRoutes } = await import('./modules/auth/auth.routes.js')
await app.register(authRoutes, { prefix: '/api/auth' })

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', async () => ({
  status: 'ok',
  version: '0.2.0',
  timestamp: new Date().toISOString(),
}))

// ── 404 handler ────────────────────────────────────────────────────────────
app.setNotFoundHandler((_request, reply) => {
  reply.status(404).send({ error: 'Route introuvable', code: 'NOT_FOUND' })
})

// ── Error handler ──────────────────────────────────────────────────────────
app.setErrorHandler((error, _request, reply) => {
  app.log.error(error)
  reply.status(500).send({ error: 'Erreur serveur interne', code: 'INTERNAL_ERROR' })
})

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3001)
await app.listen({ port: PORT, host: '0.0.0.0' })
