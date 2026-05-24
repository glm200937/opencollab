import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { NotesSidebar } from '../components/notes/NotesSidebar'
import { CollabEditor } from '../components/notes/CollabEditor'
import { listNotes, createNote, deleteNote } from '../lib/notes.api'
import type { NoteItem } from '../lib/notes.api'

const DEMO_WORKSPACE_ID = 'demo-workspace'

export default function NotesPage() {
  const queryClient = useQueryClient()
  const [activeNote, setActiveNote] = useState<NoteItem | null>(null)

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', DEMO_WORKSPACE_ID],
    queryFn:  () => listNotes(DEMO_WORKSPACE_ID),
  })

  const handleCreate = async (title: string) => {
    const note = await createNote({ title, workspaceId: DEMO_WORKSPACE_ID })
    queryClient.setQueryData(['notes', DEMO_WORKSPACE_ID], (old: NoteItem[] = []) => [note, ...old])
    setActiveNote(note)
  }

  const handleDelete = async (noteId: string) => {
    if (!confirm('Supprimer cette note ?')) return
    await deleteNote(noteId)
    queryClient.setQueryData(['notes', DEMO_WORKSPACE_ID], (old: NoteItem[] = []) =>
      old.filter(n => n.id !== noteId),
    )
    if (activeNote?.id === noteId) setActiveNote(null)
  }

  const handleTitleChange = (title: string) => {
    queryClient.setQueryData(['notes', DEMO_WORKSPACE_ID], (old: NoteItem[] = []) =>
      old.map(n => n.id === activeNote?.id ? { ...n, title } : n),
    )
    if (activeNote) setActiveNote(prev => prev ? { ...prev, title } : null)
  }

  return (
    <div className="flex h-screen bg-gray-950">
      <NotesSidebar
        notes={notes}
        activeNoteId={activeNote?.id}
        onSelect={setActiveNote}
        onCreate={handleCreate}
        onDelete={handleDelete}
        loading={isLoading}
      />

      <main className="flex-1 overflow-hidden">
        {activeNote ? (
          <CollabEditor
            key={activeNote.id}
            note={activeNote}
            onTitleChange={handleTitleChange}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-600">
            <span className="text-5xl">📝</span>
            <p className="text-sm">Sélectionnez ou créez une note</p>
          </div>
        )}
      </main>
    </div>
  )
}
