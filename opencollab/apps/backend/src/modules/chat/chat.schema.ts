import { z } from 'zod'

export const CreateChannelSchema = z.object({
  name:        z.string().min(1).max(80).regex(/^[a-z0-9_-]+$/, 'Minuscules, chiffres, _ et - uniquement'),
  workspaceId: z.string().min(1),
  isPrivate:   z.boolean().default(false),
  memberIds:   z.array(z.string()).optional(),
})

export const SendMessageSchema = z.object({
  content:   z.string().min(1).max(4000),
  channelId: z.string().min(1),
})

export const EditMessageSchema = z.object({
  content: z.string().min(1).max(4000),
})

export const ListMessagesQuerySchema = z.object({
  channelId: z.string().min(1),
  before:    z.string().optional(), // cursor (message id) pour pagination
  limit:     z.coerce.number().int().min(1).max(100).default(50),
})

export const ChannelParamsSchema = z.object({ channelId: z.string().min(1) })
export const MessageParamsSchema = z.object({ messageId: z.string().min(1) })

export type CreateChannelInput   = z.infer<typeof CreateChannelSchema>
export type SendMessageInput     = z.infer<typeof SendMessageSchema>
export type EditMessageInput     = z.infer<typeof EditMessageSchema>
export type ListMessagesQuery    = z.infer<typeof ListMessagesQuerySchema>
