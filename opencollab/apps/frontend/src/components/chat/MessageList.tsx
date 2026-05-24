import { useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import type { MessageItem } from '../../lib/chat.api'

interface MessageListProps {
  messages:      MessageItem[]
  currentUserId: string
  typingUsers:   string[]
  hasMore:       boolean
  loading:       boolean
  onLoadMore:    () => void
  onDelete:      (messageId: string) => void
  onEdit:        (msg: MessageItem) => void
}

export function MessageList({
  messages, currentUserId, typingUsers, hasMore, loading, onLoadMore, onDelete, onEdit,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const listRef   = useRef<HTMLDivElement>(null)
  const prevLen   = useRef(0)

  // Auto-scroll vers le bas sur nouveaux messages
  useEffect(() => {
    if (messages.length > prevLen.current) {
      const last = messages[messages.length - 1]
      // Scroll auto seulement si c'est un nouveau message (pas un chargement d'historique)
      if (last?.authorId === currentUserId || prevLen.current === 0) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
    prevLen.current = messages.length
  }, [messages.length, currentUserId])

  // Grouper les messages consécutifs du même auteur
  const grouped = messages.map((msg, i) => ({
    ...msg,
    isFirstInGroup: i === 0 || messages[i - 1].authorId !== msg.authorId,
    showTime:       i === messages.length - 1 || messages[i + 1].authorId !== msg.authorId,
  }))

  return (
    <div ref={listRef} className="flex flex-1 flex-col overflow-y-auto px-4 py-4 gap-0.5">

      {/* Charger plus */}
      {hasMore && (
        <div className="flex justify-center pb-4">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="rounded-full border border-gray-700 px-4 py-1.5 text-xs text-gray-400 hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Chargement…' : 'Charger les messages précédents'}
          </button>
        </div>
      )}

      {/* Messages */}
      {grouped.map((msg) => {
        const isMe = msg.authorId === currentUserId
        return (
          <div
            key={msg.id}
            className={clsx('group flex items-start gap-3', msg.isFirstInGroup ? 'mt-4' : 'mt-0.5')}
          >
            {/* Avatar */}
            <div className={clsx('flex-shrink-0 w-8', !msg.isFirstInGroup && 'invisible')}>
              <div className={clsx(
                'h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium text-white',
                isMe ? 'bg-brand-600' : 'bg-gray-700',
              )}>
                {msg.author.displayName.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              {msg.isFirstInGroup && (
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-sm font-medium text-gray-200">{msg.author.displayName}</span>
                  <span className="text-xs text-gray-600">
                    {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <p className={clsx(
                  'text-sm text-gray-200 leading-relaxed break-words',
                  msg.editedAt && 'italic',
                )}>
                  {msg.content}
                  {msg.editedAt && <span className="ml-1 text-xs text-gray-600">(modifié)</span>}
                </p>

                {/* Actions (hover) */}
                <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0 ml-auto">
                  {isMe && (
                    <button
                      onClick={() => onEdit(msg)}
                      className="rounded p-1 text-gray-500 hover:bg-gray-700 hover:text-gray-300 transition-colors"
                      title="Modifier"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(msg.id)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-700 hover:text-red-400 transition-colors"
                    title="Supprimer"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Indicateur de frappe */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 mt-3 px-1">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {typingUsers.length === 1 ? 'Quelqu\'un écrit…' : `${typingUsers.length} personnes écrivent…`}
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
