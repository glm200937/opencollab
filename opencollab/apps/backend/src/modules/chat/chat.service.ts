import { prisma } from '../../lib/prisma.js'
import type { CreateChannelInput, SendMessageInput, EditMessageInput, ListMessagesQuery } from './chat.schema.js'

async function assertMember(userId: string, workspaceId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  })
  if (!member) throw Object.assign(new Error('Accès refusé'), { code: 'FORBIDDEN', status: 403 })
  return member
}

async function assertChannelAccess(userId: string, channelId: string) {
  const channel = await prisma.chatChannel.findUnique({ where: { id: channelId } })
  if (!channel) throw Object.assign(new Error('Salon introuvable'), { code: 'NOT_FOUND', status: 404 })
  await assertMember(userId, channel.workspaceId)
  return channel
}

export const ChatService = {

  // ── Channels ──────────────────────────────────────────────────────────────

  async createChannel(input: CreateChannelInput & { userId: string }) {
    await assertMember(input.userId, input.workspaceId)

    // Vérifier unicité du nom dans le workspace
    const existing = await prisma.chatChannel.findFirst({
      where: { name: input.name, workspaceId: input.workspaceId },
    })
    if (existing) throw Object.assign(new Error('Un salon avec ce nom existe déjà'), { code: 'NAME_TAKEN', status: 409 })

    return prisma.chatChannel.create({
      data: {
        name:        input.name,
        workspaceId: input.workspaceId,
        isPrivate:   input.isPrivate,
        memberIds:   [input.userId, ...(input.memberIds ?? [])],
      },
    })
  },

  async listChannels(workspaceId: string, userId: string) {
    await assertMember(userId, workspaceId)
    return prisma.chatChannel.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { author: { select: { displayName: true } } },
        },
      },
      orderBy: { id: 'asc' },
    })
  },

  async deleteChannel(channelId: string, userId: string) {
    const channel = await assertChannelAccess(userId, channelId)
    const member  = await assertMember(userId, channel.workspaceId)
    if (!['OWNER', 'ADMIN'].includes(member.role)) {
      throw Object.assign(new Error('Seul un admin peut supprimer un salon'), { code: 'FORBIDDEN', status: 403 })
    }
    await prisma.chatChannel.delete({ where: { id: channelId } })
    return { deleted: true }
  },

  // ── Messages ──────────────────────────────────────────────────────────────

  async sendMessage(input: SendMessageInput & { authorId: string }) {
    await assertChannelAccess(input.authorId, input.channelId)

    return prisma.chatMessage.create({
      data: {
        content:   input.content,
        authorId:  input.authorId,
        channelId: input.channelId,
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    })
  },

  async listMessages(query: ListMessagesQuery & { userId: string }) {
    await assertChannelAccess(query.userId, query.channelId)

    return prisma.chatMessage.findMany({
      where: {
        channelId: query.channelId,
        ...(query.before && { id: { lt: query.before } }),
      },
      include: { author: { select: { id: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take:    query.limit,
    })
  },

  async editMessage(messageId: string, userId: string, input: EditMessageInput) {
    const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } })
    if (!msg) throw Object.assign(new Error('Message introuvable'), { code: 'NOT_FOUND', status: 404 })
    if (msg.authorId !== userId) throw Object.assign(new Error('Seul l\'auteur peut modifier'), { code: 'FORBIDDEN', status: 403 })

    return prisma.chatMessage.update({
      where: { id: messageId },
      data:  { content: input.content, editedAt: new Date() },
      include: { author: { select: { id: true, displayName: true, avatarUrl: true } } },
    })
  },

  async deleteMessage(messageId: string, userId: string) {
    const msg = await prisma.chatMessage.findUnique({
      where:   { id: messageId },
      include: { channel: true },
    })
    if (!msg) throw Object.assign(new Error('Message introuvable'), { code: 'NOT_FOUND', status: 404 })

    const member = await assertMember(userId, msg.channel.workspaceId)
    const canDelete = msg.authorId === userId || ['OWNER', 'ADMIN'].includes(member.role)
    if (!canDelete) throw Object.assign(new Error('Accès refusé'), { code: 'FORBIDDEN', status: 403 })

    await prisma.chatMessage.delete({ where: { id: messageId } })
    return { deleted: true }
  },
}
