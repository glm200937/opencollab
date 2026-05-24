import { useState } from 'react'
import { clsx } from 'clsx'
import type { ChannelItem } from '../../lib/chat.api'

interface ChannelSidebarProps {
  channels:        ChannelItem[]
  activeChannelId: string | null
  onSelect:        (channel: ChannelItem) => void
  onCreate:        (name: string, isPrivate: boolean) => void
  loading?:        boolean
}

export function ChannelSidebar({ channels, activeChannelId, onSelect, onCreate, loading }: ChannelSidebarProps) {
  const [creating,  setCreating]  = useState(false)
  const [name,      setName]      = useState('')
  const [isPrivate, setIsPrivate] = useState(false)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim().toLowerCase().replace(/\s+/g, '-')
    if (!trimmed) return
    onCreate(trimmed, isPrivate)
    setName('')
    setIsPrivate(false)
    setCreating(false)
  }

  const publicChannels  = channels.filter(c => !c.isPrivate)
  const privateChannels = channels.filter(c => c.isPrivate)

  return (
    <aside className="flex h-full w-56 flex-shrink-0 flex-col border-r border-gray-800 bg-gray-950">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <span className="text-sm font-medium text-gray-300">Chat</span>
        <button
          onClick={() => setCreating(v => !v)}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          title="Nouveau salon"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Créer un salon */}
      {creating && (
        <form onSubmit={handleCreate} className="border-b border-gray-800 p-3 flex flex-col gap-2">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="nom-du-salon"
            className="w-full rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-1 focus:ring-brand-500"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={e => setIsPrivate(e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-brand-500"
            />
            <span className="text-xs text-gray-400">Salon privé 🔒</span>
          </label>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 rounded-md bg-brand-600 py-1 text-xs font-medium text-white hover:bg-brand-500">
              Créer
            </button>
            <button type="button" onClick={() => setCreating(false)} className="flex-1 rounded-md bg-gray-700 py-1 text-xs text-gray-300 hover:bg-gray-600">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Liste */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-700 border-t-brand-500" />
          </div>
        ) : (
          <>
            {/* Salons publics */}
            {publicChannels.length > 0 && (
              <div>
                <p className="px-4 py-1 text-xs font-medium uppercase tracking-wider text-gray-600">
                  Salons
                </p>
                {publicChannels.map(ch => (
                  <ChannelRow key={ch.id} channel={ch} active={activeChannelId === ch.id} onSelect={onSelect} />
                ))}
              </div>
            )}
            {/* Salons privés */}
            {privateChannels.length > 0 && (
              <div className="mt-2">
                <p className="px-4 py-1 text-xs font-medium uppercase tracking-wider text-gray-600">
                  Privés
                </p>
                {privateChannels.map(ch => (
                  <ChannelRow key={ch.id} channel={ch} active={activeChannelId === ch.id} onSelect={onSelect} />
                ))}
              </div>
            )}
            {channels.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-gray-600">
                Aucun salon.<br />Créez-en un !
              </p>
            )}
          </>
        )}
      </div>
    </aside>
  )
}

function ChannelRow({ channel, active, onSelect }: { channel: ChannelItem; active: boolean; onSelect: (c: ChannelItem) => void }) {
  return (
    <div
      onClick={() => onSelect(channel)}
      className={clsx(
        'flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors',
        active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200',
      )}
    >
      <span className="text-gray-500 text-sm">{channel.isPrivate ? '🔒' : '#'}</span>
      <span className="flex-1 truncate text-sm">{channel.name}</span>
    </div>
  )
}
