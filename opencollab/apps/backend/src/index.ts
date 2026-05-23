import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { ensureBucket } from './lib/minio.js'

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
const { authRoutes }  = await import('./modules/auth/auth.routes.js')
const { filesRoutes } = await import('./modules/files/files.routes.js')

await app.register(authRoutes,  { prefix: '/api/auth' })
await app.register(filesRoutes, { prefix: '/api/files' })

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', async () => ({
  status: 'ok',
  version: '0.3.0',
  timestamp: new Date().toISOString(),
}))

// ── Handlers globaux ───────────────────────────────────────────────────────
app.setNotFoundHandler((_req, reply) => {
  reply.status(404).send({ error: 'Route introuvable', code: 'NOT_FOUND' })
})

app.setErrorHandler((error, _req, reply) => {
  app.log.error(error)
  reply.status(500).send({ error: 'Erreur serveur interne', code: 'INTERNAL_ERROR' })
})

// ── Démarrage ──────────────────────────────────────────────────────────────
await ensureBucket()

const PORT = Number(process.env.PORT ?? 3001)
await app.listen({ port: PORT, host: '0.0.0.0' })
