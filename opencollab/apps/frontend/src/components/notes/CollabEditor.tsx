import { useEffect, useState } from 'react'
import { EditorContent } from '@tiptap/react'
import { useCollabEditor } from '../../hooks/useCollabEditor'
import { updateNote } from '../../lib/notes.api'
import { clsx } from 'clsx'
import type { NoteItem } from '../../lib/notes.api'

interface CollabEditorProps {
  note:       NoteItem
  onTitleChange: (title: string) => void
}

export function CollabEditor({ note, onTitleChange }: CollabEditorProps) {
  const { editor, connected, collaborators, wsError } = useCollabEditor({ noteId: note.id })
  const [title,        setTitle]        = useState(note.title)
  const [savingTitle,  setSavingTitle]  = useState(false)
  const [lastSaved,    setLastSaved]    = useState<Date | null>(null)

  // Sync titre si note change
  useEffect(() => { setTitle(note.title) }, [note.id, note.title])

  // Auto-save titre après 1s d'inactivité
  useEffect(() => {
    if (title === note.title) return
    const t = setTimeout(async () => {
      setSavingTitle(true)
      try {
        await updateNote(note.id, { title })
        onTitleChange(title)
        setLastSaved(new Date())
      } finally {
        setSavingTitle(false)
      }
    }, 1000)
    return () => clearTimeout(t)
  }, [title, note.id, note.title, onTitleChange])

  return (
    <div className="flex h-full flex-col bg-gray-950">

      {/* Topbar */}
      <div className="flex items-center justify-between border-b border-gray-800 px-6 py-2">
        <div className="flex items-center gap-3">
          {/* Indicateur connexion temps réel */}
          <div className="flex items-center gap-1.5">
            <div className={clsx(
              'h-2 w-2 rounded-full',
              connected ? 'bg-green-500 animate-pulse' : 'bg-gray-600',
            )} />
            <span className="text-xs text-gray-500">
              {connected ? 'Connecté' : 'Hors ligne'}
            </span>
          </div>

          {/* Collaborateurs en ligne */}
          {collaborators.length > 0 && (
            <div className="flex items-center gap-1">
              {collaborators.map((c) => (
                <div
                  key={c.userId}
                  className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                  style={{ background: c.cursorColor }}
                  title={`Utilisateur ${c.userId.slice(0, 6)}`}
                >
                  {c.userId.slice(0, 1).toUpperCase()}
                </div>
              ))}
              <span className="text-xs text-gray-500 ml-1">
                {collaborators.length} collaborateur{collaborators.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          {wsError && <span className="text-yellow-500">{wsError}</span>}
          {savingTitle && <span>Sauvegarde…</span>}
          {lastSaved && !savingTitle && (
            <span>Sauvegardé à {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-10">
          {/* Titre */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la note…"
            className="mb-6 w-full bg-transparent text-3xl font-bold text-white outline-none placeholder:text-gray-600"
          />

          {/* Éditeur TipTap */}
          {editor ? (
            <EditorContent
              editor={editor}
              className="prose prose-invert prose-sm max-w-none focus:outline-none [&_.ProseMirror]:min-h-[400px] [&_.ProseMirror]:outline-none"
            />
          ) : (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-700 border-t-brand-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
