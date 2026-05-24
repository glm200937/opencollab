import { useEffect, useRef, useState, useCallback } from 'react'
import { getSocket } from '../lib/chat.api'
import { listMessages } from '../lib/chat.api'
import type { MessageItem } from '../lib/chat.api'

export function useChat(channelId: string | null) {
  const [messages,      setMessages]      = useState<MessageItem[]>([])
  const [loading,       setLoading]       = useState(false)
  const [connected,     setConnected]     = useState(false)
  const [typingUsers,   setTypingUsers]   = useState<string[]>([])
  const [hasMore,       setHasMore]       = useState(true)
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // ── Charger l'historique ─────────────────────────────────────────────────
  const loadHistory = useCallback(async (before?: string) => {
    if (!channelId) return
    setLoading(true)
    try {
      const history = await listMessages(channelId, before)
      // Les messages arrivent en DESC — on les remet en ordre chronologique
      const ordered = [...history].reverse()
      if (before) {
        setMessages(prev => [...ordered, ...prev])
      } else {
        setMessages(ordered)
      }
      setHasMore(history.length === 50)
    } finally {
      setLoading(false)
    }
  }, [channelId])

  // ── Socket.io ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!channelId) return
    const socket = getSocket()

    // Rejoindre le canal
    socket.emit('channel:join', channelId)

    const onConnect    = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    const onNewMessage = (msg: MessageItem) => {
      if (msg.channelId !== channelId) return
      setMessages(prev => [...prev, msg])
      // Retirer l'indicateur de frappe de cet auteur
      setTypingUsers(prev => prev.filter(id => id !== msg.authorId))
    }

    const onMessageUpdated = (msg: MessageItem) => {
      if (msg.channelId !== channelId) return
      setMessages(prev => prev.map(m => m.id === msg.id ? msg : m))
    }

    const onMessageDeleted = ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId))
    }

    const onTypingStart = ({ userId }: { userId: string }) => {
      setTypingUsers(prev => prev.includes(userId) ? prev : [...prev, userId])
      // Auto-clear après 4s si pas de stop reçu
      if (typingTimers.current.has(userId)) clearTimeout(typingTimers.current.get(userId)!)
      typingTimers.current.set(userId, setTimeout(() => {
        setTypingUsers(prev => prev.filter(id => id !== userId))
      }, 4000))
    }

    const onTypingStop = ({ userId }: { userId: string }) => {
      if (typingTimers.current.has(userId)) clearTimeout(typingTimers.current.get(userId)!)
      setTypingUsers(prev => prev.filter(id => id !== userId))
    }

    socket.on('connect',          onConnect)
    socket.on('disconnect',       onDisconnect)
    socket.on('message:new',      onNewMessage)
    socket.on('message:updated',  onMessageUpdated)
    socket.on('message:deleted',  onMessageDeleted)
    socket.on('typing:start',     onTypingStart)
    socket.on('typing:stop',      onTypingStop)

    setConnected(socket.connected)
    loadHistory()

    return () => {
      socket.emit('channel:leave', channelId)
      socket.off('connect',         onConnect)
      socket.off('disconnect',      onDisconnect)
      socket.off('message:new',     onNewMessage)
      socket.off('message:updated', onMessageUpdated)
      socket.off('message:deleted', onMessageDeleted)
      socket.off('typing:start',    onTypingStart)
      socket.off('typing:stop',     onTypingStop)
      setMessages([])
      setTypingUsers([])
    }
  }, [channelId, loadHistory])

  // ── Actions ───────────────────────────────────────────────────────────────
  const sendMessage = useCallback((content: string) => {
    if (!channelId || !content.trim()) return
    getSocket().emit('message:send', { content: content.trim(), channelId })
  }, [channelId])

  const editMessage = useCallback((messageId: string, content: string) => {
    getSocket().emit('message:edit', { messageId, content })
  }, [])

  const deleteMessage = useCallback((messageId: string) => {
    if (!channelId) return
    getSocket().emit('message:delete', { messageId, channelId })
  }, [channelId])

  const startTyping = useCallback(() => {
    if (channelId) getSocket().emit('typing:start', channelId)
  }, [channelId])

  const stopTyping = useCallback(() => {
    if (channelId) getSocket().emit('typing:stop', channelId)
  }, [channelId])

  const loadMore = useCallback(() => {
    if (messages.length > 0) loadHistory(messages[0].id)
  }, [messages, loadHistory])

  return {
    messages, loading, connected, typingUsers, hasMore,
    sendMessage, editMessage, deleteMessage,
    startTyping, stopTyping, loadMore,
  }
}
