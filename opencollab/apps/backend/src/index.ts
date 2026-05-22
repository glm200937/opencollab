import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'

const app = Fastify({ logger: true })

// ── Plugins ────────────────────────────────────────────────────────────────
await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'change-me-in-production',
})

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', async () => ({ status: 'ok', version: '0.1.0' }))

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3001)
await app.listen({ port: PORT, host: '0.0.0.0' })
console.log(`🚀 Backend running on http://localhost:${PORT}`)
