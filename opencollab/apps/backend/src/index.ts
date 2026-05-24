import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'
import { ensureBucket } from './lib/minio.js'
import { registerNotesWs } from './modules/notes/notes.ws.js'
import { registerChatSocket } from './modules/chat/chat.socket.js'

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
await app.register(websocket)

// ── Routes ─────────────────────────────────────────────────────────────────
const { authRoutes }  = await import('./modules/auth/auth.routes.js')
const { filesRoutes } = await import('./modules/files/files.routes.js')
const { notesRoutes } = await import('./modules/notes/notes.routes.js')
const { tasksRoutes } = await import('./modules/tasks/tasks.routes.js')
const { chatRoutes }  = await import('./modules/chat/chat.routes.js')

await app.register(authRoutes,  { prefix: '/api/auth' })
await app.register(filesRoutes, { prefix: '/api/files' })
await app.register(notesRoutes, { prefix: '/api/notes' })
await app.register(tasksRoutes, { prefix: '/api/tasks' })
await app.register(chatRoutes,  { prefix: '/api/chat' })

// ── Health ─────────────────────────────────────────────────────────────────
app.get('/health', async () => ({
  status: 'ok', version: '0.6.0',
  modules: ['auth', 'files', 'notes', 'tasks', 'chat'],
  timestamp: new Date().toISOString(),
}))

app.setNotFoundHandler((_req, reply) =>
  reply.status(404).send({ error: 'Route introuvable', code: 'NOT_FOUND' }))
app.setErrorHandler((error, _req, reply) => {
  app.log.error(error)
  reply.status(500).send({ error: 'Erreur serveur interne', code: 'INTERNAL_ERROR' })
})

// ── Démarrage ──────────────────────────────────────────────────────────────
await ensureBucket()
await registerNotesWs(app)

const PORT = Number(process.env.PORT ?? 3001)
await app.listen({ port: PORT, host: '0.0.0.0' })

// Socket.io sur le même serveur HTTP
registerChatSocket(
  app.server,
  process.env.FRONTEND_URL ?? 'http://localhost:5173',
)

app.log.info('✅ OpenCollab v0.6.0 — tous les modules actifs')
