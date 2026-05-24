import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate.js'
import { ChatService } from './chat.service.js'
import {
  CreateChannelSchema, SendMessageSchema, EditMessageSchema,
  ListMessagesQuerySchema, ChannelParamsSchema, MessageParamsSchema,
} from './chat.schema.js'

export async function chatRoutes(app: FastifyInstance) {

  // ── Channels ──────────────────────────────────────────────────────────────
  app.post('/channels', { preHandler: authenticate }, async (req, reply) => {
    const r = CreateChannelSchema.safeParse(req.body)
    if (!r.success) return reply.status(400).send({ error: 'Validation échouée', code: 'VALIDATION_ERROR', details: r.error.flatten().fieldErrors })
    try {
      const channel = await ChatService.createChannel({ ...r.data, userId: req.userId })
      return reply.status(201).send({ data: channel })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  app.get('/channels', { preHandler: authenticate }, async (req, reply) => {
    const { workspaceId } = req.query as { workspaceId?: string }
    if (!workspaceId) return reply.status(400).send({ error: 'workspaceId requis', code: 'VALIDATION_ERROR' })
    try {
      const channels = await ChatService.listChannels(workspaceId, req.userId)
      return reply.send({ data: channels })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  app.delete('/channels/:channelId', { preHandler: authenticate }, async (req, reply) => {
    const p = ChannelParamsSchema.safeParse(req.params)
    if (!p.success) return reply.status(400).send({ error: 'channelId invalide', code: 'VALIDATION_ERROR' })
    try {
      return reply.send({ data: await ChatService.deleteChannel(p.data.channelId, req.userId) })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  // ── Messages ──────────────────────────────────────────────────────────────
  app.post('/messages', { preHandler: authenticate }, async (req, reply) => {
    const r = SendMessageSchema.safeParse(req.body)
    if (!r.success) return reply.status(400).send({ error: 'Validation échouée', code: 'VALIDATION_ERROR', details: r.error.flatten().fieldErrors })
    try {
      const msg = await ChatService.sendMessage({ ...r.data, authorId: req.userId })
      return reply.status(201).send({ data: msg })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  app.get('/messages', { preHandler: authenticate }, async (req, reply) => {
    const r = ListMessagesQuerySchema.safeParse(req.query)
    if (!r.success) return reply.status(400).send({ error: 'Paramètres invalides', code: 'VALIDATION_ERROR' })
    try {
      const messages = await ChatService.listMessages({ ...r.data, userId: req.userId })
      return reply.send({ data: messages })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  app.patch('/messages/:messageId', { preHandler: authenticate }, async (req, reply) => {
    const p = MessageParamsSchema.safeParse(req.params)
    const b = EditMessageSchema.safeParse(req.body)
    if (!p.success || !b.success) return reply.status(400).send({ error: 'Paramètres invalides', code: 'VALIDATION_ERROR' })
    try {
      return reply.send({ data: await ChatService.editMessage(p.data.messageId, req.userId, b.data) })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  app.delete('/messages/:messageId', { preHandler: authenticate }, async (req, reply) => {
    const p = MessageParamsSchema.safeParse(req.params)
    if (!p.success) return reply.status(400).send({ error: 'messageId invalide', code: 'VALIDATION_ERROR' })
    try {
      return reply.send({ data: await ChatService.deleteMessage(p.data.messageId, req.userId) })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })
}
