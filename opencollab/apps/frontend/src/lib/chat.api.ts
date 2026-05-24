import { api } from './api'
import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '../store/auth.store'

export interface ChannelItem {
  id:          string
  name:        string
  workspaceId: string
  isPrivate:   boolean
  memberIds:   string[]
  _count:      { messages: number }
  messages:    MessageItem[]  // dernier message
}

export interface MessageItem {
  id:        string
  content:   string
  authorId:  string
  channelId: string
  createdAt: string
  editedAt?: string
  author:    { id: string; displayName: string; avatarUrl?: string }
}

// ── REST ──────────────────────────────────────────────────────────────────
export const listChannels = async (workspaceId: string) =>
  (await api.get<{ data: ChannelItem[] }>(`/chat/channels?workspaceId=${workspaceId}`)).data.data

export const createChannel = async (name: string, workspaceId: string, isPrivate = false) =>
  (await api.post<{ data: ChannelItem }>('/chat/channels', { name, workspaceId, isPrivate })).data.data

export const deleteChannel = async (channelId: string) =>
  api.delete(`/chat/channels/${channelId}`)

export const listMessages = async (channelId: string, before?: string, limit = 50) => {
  const params = new URLSearchParams({ channelId, limit: String(limit) })
  if (before) params.set('before', before)
  return (await api.get<{ data: MessageItem[] }>(`/chat/messages?${params}`)).data.data
}

// ── Socket.io ─────────────────────────────────────────────────────────────
let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const token = useAuthStore.getState().accessToken
    socket = io(window.location.origin, {
      path:            '/socket.io',
      auth:            { token },
      transports:      ['websocket'],
      autoConnect:     true,
      reconnectionDelay: 1000,
    })
  }
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
