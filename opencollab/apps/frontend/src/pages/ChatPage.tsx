import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChannelSidebar } from '../components/chat/ChannelSidebar'
import { MessageList } from '../components/chat/MessageList'
import { MessageInput } from '../components/chat/MessageInput'
import { useChat } from '../hooks/useChat'
import { useAuthStore } from '../store/auth.store'
import { listChannels, createChannel } from '../lib/chat.api'
import type { ChannelItem, MessageItem } from '../lib/chat.api'
import { clsx } from 'clsx'

const DEMO_WORKSPACE_ID = 'demo-workspace'

export default function ChatPage() {
  const queryClient   = useQueryClient()
  const user          = useAuthStore(s => s.user)
  const [activeChannel, setActiveChannel] = useState<ChannelItem | null>(null)
  const [editingMsg,    setEditingMsg]    = useState<MessageItem | null>(null)

  // Charger les canaux
  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['channels', DEMO_WORKSPACE_ID],
    queryFn:  () => listChannels(DEMO_WORKSPACE_ID),
    onSuccess: (data: ChannelItem[]) => {
      if (data.length > 0 && !activeChannel) setActiveChannel(data[0])
    },
  })

  // Hook chat temps réel
  const {
    messages, loading: msgLoading, connected, typingUsers, hasMore,
    sendMessage, editMessage, deleteMessage, startTyping, stopTyping, loadMore,
  } = useChat(activeChannel?.id ?? null)

  const handleCreateChannel = async (name: string, isPrivate: boolean) => {
    const channel = await createChannel(name, DEMO_WORKSPACE_ID, isPrivate)
    queryClient.setQueryData(['channels', DEMO_WORKSPACE_ID], (old: ChannelItem[] = []) => [...old, channel])
    setActiveChannel(channel)
  }

  const handleSend = (content: string) => {
    if (editingMsg) {
      editMessage(editingMsg.id, content)
      setEditingMsg(null)
    } else {
      sendMessage(content)
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm('Supprimer ce message ?')) return
    deleteMessage(messageId)
  }

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar canaux */}
      <ChannelSidebar
        channels={channels}
        activeChannelId={activeChannel?.id ?? null}
        onSelect={setActiveChannel}
        onCreate={handleCreateChannel}
        loading={isLoading}
      />

      {/* Zone principale */}
      <div className="flex flex-1 flex-col min-w-0">
        {activeChannel ? (
          <>
            {/* Header canal */}
            <div className="flex items-center gap-3 border-b border-gray-800 px-5 py-3">
              <span className="text-gray-500">{activeChannel.isPrivate ? '🔒' : '#'}</span>
              <h2 className="text-sm font-medium text-white">{activeChannel.name}</h2>
              <div className={clsx(
                'ml-auto flex items-center gap-1.5 text-xs',
                connected ? 'text-green-500' : 'text-gray-600',
              )}>
                <div className={clsx('h-1.5 w-1.5 rounded-full', connected ? 'bg-green-500 animate-pulse' : 'bg-gray-600')} />
                {connected ? 'En ligne' : 'Hors ligne'}
              </div>
            </div>

            {/* Messages */}
            {msgLoading && messages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-700 border-t-brand-500" />
              </div>
            ) : (
              <MessageList
                messages={messages}
                currentUserId={user?.id ?? ''}
                typingUsers={typingUsers}
                hasMore={hasMore}
                loading={msgLoading}
                onLoadMore={loadMore}
                onDelete={handleDelete}
                onEdit={setEditingMsg}
              />
            )}

            {/* Input */}
            <MessageInput
              onSend={handleSend}
              onTyping={startTyping}
              onStopTyping={stopTyping}
              disabled={!connected}
              editingContent={editingMsg?.content}
              onCancelEdit={() => setEditingMsg(null)}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-600">
            <span className="text-5xl">💬</span>
            <p className="text-sm">Sélectionnez ou créez un salon</p>
          </div>
        )}
      </div>
    </div>
  )
}
