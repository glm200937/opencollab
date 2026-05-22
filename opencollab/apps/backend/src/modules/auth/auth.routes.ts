import type { FastifyInstance } from 'fastify'
import { RegisterSchema, LoginSchema, RefreshSchema } from './auth.schema.js'
import { AuthService } from './auth.service.js'
import { authenticate } from '../../middleware/authenticate.js'

export async function authRoutes(app: FastifyInstance) {

  // POST /api/auth/register
  app.post('/register', async (request, reply) => {
    const result = RegisterSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        error: 'Validation échouée',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten().fieldErrors,
      })
    }

    try {
      const data = await AuthService.register(result.data)
      return reply.status(201).send({ data })
    } catch (err: any) {
      return reply.status(err.status ?? 500).send({
        error: err.message,
        code:  err.code ?? 'INTERNAL_ERROR',
      })
    }
  })

  // POST /api/auth/login
  app.post('/login', async (request, reply) => {
    const result = LoginSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        error: 'Validation échouée',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten().fieldErrors,
      })
    }

    try {
      const data = await AuthService.login(result.data)
      return reply.send({ data })
    } catch (err: any) {
      return reply.status(err.status ?? 500).send({
        error: err.message,
        code:  err.code ?? 'INTERNAL_ERROR',
      })
    }
  })

  // POST /api/auth/refresh
  app.post('/refresh', async (request, reply) => {
    const result = RefreshSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'refreshToken requis', code: 'VALIDATION_ERROR' })
    }

    try {
      const tokens = await AuthService.refresh(result.data.refreshToken)
      return reply.send({ data: tokens })
    } catch (err: any) {
      return reply.status(err.status ?? 500).send({
        error: err.message,
        code:  err.code ?? 'INTERNAL_ERROR',
      })
    }
  })

  // GET /api/auth/me  (protégé)
  app.get('/me', { preHandler: authenticate }, async (request, reply) => {
    try {
      const user = await AuthService.me(request.userId)
      return reply.send({ data: user })
    } catch (err: any) {
      return reply.status(err.status ?? 500).send({
        error: err.message,
        code:  err.code ?? 'INTERNAL_ERROR',
      })
    }
  })

  // POST /api/auth/logout  (côté client — invalider le token local)
  app.post('/logout', { preHandler: authenticate }, async (_request, reply) => {
    // Avec JWT stateless, le logout est géré côté client.
    // En v0.3 on ajoutera une blacklist Redis pour les refresh tokens.
    return reply.send({ data: { message: 'Déconnecté avec succès' } })
  })
}
