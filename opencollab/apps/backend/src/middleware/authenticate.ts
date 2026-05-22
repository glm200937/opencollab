import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken } from '../lib/jwt.js'

declare module 'fastify' {
  interface FastifyRequest {
    userId: string
    userEmail: string
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const header = request.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing token', code: 'UNAUTHORIZED' })
  }

  const token = header.slice(7)
  try {
    const payload = verifyAccessToken(token)
    request.userId    = payload.userId
    request.userEmail = payload.email
  } catch {
    return reply.status(401).send({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' })
  }
}
