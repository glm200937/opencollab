import { api } from './api'

export interface NoteItem {
  id:          string
  title:       string
  content:     any
  workspaceId: string
  authorId:    string
  parentId:    string | null
  isPublic:    boolean
  createdAt:   string
  updatedAt:   string
  author:      { id: string; displayName: string; avatarUrl?: string }
  children?:   { id: string; title: string; updatedAt: string }[]
}

export async function createNote(data: {
  title: string
  workspaceId: string
  parentId?: string
  isPublic?: boolean
}): Promise<NoteItem> {
  const res = await api.post<{ data: NoteItem }>('/notes', data)
  return res.data.data
}

export async function listNotes(workspaceId: string, parentId?: string): Promise<NoteItem[]> {
  const params = new URLSearchParams({ workspaceId })
  if (parentId) params.set('parentId', parentId)
  const res = await api.get<{ data: NoteItem[] }>(`/notes?${params}`)
  return res.data.data
}

export async function getNote(noteId: string): Promise<NoteItem> {
  const res = await api.get<{ data: NoteItem }>(`/notes/${noteId}`)
  return res.data.data
}

export async function updateNote(noteId: string, data: {
  title?: string
  content?: any
  isPublic?: boolean
}): Promise<NoteItem> {
  const res = await api.patch<{ data: NoteItem }>(`/notes/${noteId}`, data)
  return res.data.data
}

export async function deleteNote(noteId: string): Promise<void> {
  await api.delete(`/notes/${noteId}`)
}
