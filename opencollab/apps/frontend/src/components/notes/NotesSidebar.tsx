import { useState } from 'react'
import { clsx } from 'clsx'
import type { NoteItem } from '../../lib/notes.api'

interface NotesSidebarProps {
  notes:         NoteItem[]
  activeNoteId?: string
  onSelect:      (note: NoteItem) => void
  onCreate:      (title: string) => void
  onDelete:      (noteId: string) => void
  loading?:      boolean
}

export function NotesSidebar({
  notes, activeNoteId, onSelect, onCreate, onDelete, loading,
}: NotesSidebarProps) {
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    onCreate(title)
    setNewTitle('')
    setCreating(false)
  }

  return (
    <aside className="flex h-full w-60 flex-shrink-0 flex-col border-r border-gray-800 bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-sm font-medium text-gray-300">Notes</span>
        <button
          onClick={() => setCreating(true)}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          title="Nouvelle note"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Formulaire nouvelle note */}
      {creating && (
        <form onSubmit={handleCreate} className="border-b border-gray-800 p-3">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Titre de la note…"
            className="w-full rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-1 focus:ring-brand-500"
          />
          <div className="mt-2 flex gap-2">
            <button type="submit"
              className="flex-1 rounded-md bg-brand-600 py-1 text-xs font-medium text-white hover:bg-brand-500">
              Créer
            </button>
            <button type="button" onClick={() => setCreating(false)}
              className="flex-1 rounded-md bg-gray-700 py-1 text-xs text-gray-300 hover:bg-gray-600">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Liste */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-700 border-t-brand-500" />
          </div>
        ) : notes.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-gray-500">
            Aucune note.<br />Créez-en une !
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={clsx(
                'group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
                activeNoteId === note.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200',
              )}
              onClick={() => onSelect(note)}
            >
              <span className="text-base">📝</span>
              <span className="flex-1 truncate text-sm">{note.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
                className="hidden group-hover:block rounded p-0.5 text-gray-500 hover:text-red-400"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
