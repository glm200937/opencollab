import { Server as SocketServer } from 'socket.io'
import type { Server as HttpServer } from 'http'
import { verifyAccessToken } from '../../lib/jwt.js'
import { ChatService } from './chat.service.js'

// Map channelId → Set<socketId> pour les rooms
const onlineUsers = new Map<string, { userId: string; displayName: string }>()

export function registerChatSocket(httpServer: HttpServer, frontendUrl: string) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin:      frontendUrl,
      credentials: true,
    },
    path: '/socket.io',
  })

  // ── Middleware auth ────────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined
    if (!token) return next(new Error('Token manquant'))
    try {
      const payload = verifyAccessToken(token)
      socket.data.userId = payload.userId
      socket.data.email  = payload.email
      next()
    } catch {
      next(new Error('Token invalide'))
    }
  })

  // ── Connexion ──────────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.data.userId as string

    // ── Rejoindre un canal ────────────────────────────────────────────────
    socket.on('channel:join', async (channelId: string) => {
      try {
        // Vérifier accès (ChatService.listMessages valide l'accès)
        socket.join(`channel:${channelId}`)
        socket.data.channelId = channelId

        // Annoncer la présence
        socket.to(`channel:${channelId}`).emit('user:online', {
          userId,
          channelId,
        })
      } catch {
        socket.emit('error', { message: 'Accès refusé à ce salon' })
      }
    })

    // ── Quitter un canal ──────────────────────────────────────────────────
    socket.on('channel:leave', (channelId: string) => {
      socket.leave(`channel:${channelId}`)
      socket.to(`channel:${channelId}`).emit('user:offline', { userId, channelId })
    })

    // ── Envoyer un message ────────────────────────────────────────────────
    socket.on('message:send', async (data: { content: string; channelId: string }) => {
      try {
        const message = await ChatService.sendMessage({
          content:   data.content,
          channelId: data.channelId,
          authorId:  userId,
        })
        // Diffuser à tous dans le canal (y compris l'émetteur)
        io.to(`channel:${data.channelId}`).emit('message:new', message)
      } catch (err: any) {
        socket.emit('error', { message: err.message ?? 'Erreur envoi message' })
      }
    })

    // ── Modifier un message ───────────────────────────────────────────────
    socket.on('message:edit', async (data: { messageId: string; content: string }) => {
      try {
        const message = await ChatService.editMessage(data.messageId, userId, { content: data.content })
        io.to(`channel:${message.channelId}`).emit('message:updated', message)
      } catch (err: any) {
        socket.emit('error', { message: err.message ?? 'Erreur modification' })
      }
    })

    // ── Supprimer un message ──────────────────────────────────────────────
    socket.on('message:delete', async (data: { messageId: string; channelId: string }) => {
      try {
        await ChatService.deleteMessage(data.messageId, userId)
        io.to(`channel:${data.channelId}`).emit('message:deleted', {
          messageId: data.messageId,
          channelId: data.channelId,
        })
      } catch (err: any) {
        socket.emit('error', { message: err.message ?? 'Erreur suppression' })
      }
    })

    // ── Indicateur de frappe ──────────────────────────────────────────────
    socket.on('typing:start', (channelId: string) => {
      socket.to(`channel:${channelId}`).emit('typing:start', { userId, channelId })
    })
    socket.on('typing:stop', (channelId: string) => {
      socket.to(`channel:${channelId}`).emit('typing:stop', { userId, channelId })
    })

    // ── Déconnexion ───────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id)
      if (socket.data.channelId) {
        socket.to(`channel:${socket.data.channelId}`).emit('user:offline', {
          userId,
          channelId: socket.data.channelId,
        })
      }
    })
  })

  return io
}
