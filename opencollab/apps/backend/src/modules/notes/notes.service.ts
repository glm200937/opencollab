import { prisma } from '../../lib/prisma.js'
import type { CreateNoteInput, UpdateNoteInput } from './notes.schema.js'

export const NotesService = {

  async create(input: CreateNoteInput & { authorId: string }) {
    // Vérifier accès workspace
    await NotesService._assertMember(input.authorId, input.workspaceId)

    return prisma.note.create({
      data: {
        title:       input.title,
        content:     {},
        workspaceId: input.workspaceId,
        authorId:    input.authorId,
        parentId:    input.parentId,
        isPublic:    input.isPublic,
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    })
  },

  async list(opts: { workspaceId: string; userId: string; parentId?: string }) {
    await NotesService._assertMember(opts.userId, opts.workspaceId)

    return prisma.note.findMany({
      where: {
        workspaceId: opts.workspaceId,
        parentId:    opts.parentId ?? null,
      },
      include: {
        author:   { select: { id: true, displayName: true, avatarUrl: true } },
        children: { select: { id: true, title: true, createdAt: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
  },

  async getById(noteId: string, userId: string) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        author:   { select: { id: true, displayName: true, avatarUrl: true } },
        children: { select: { id: true, title: true, updatedAt: true } },
      },
    })
    if (!note) {
      throw Object.assign(new Error('Note introuvable'), { code: 'NOT_FOUND', status: 404 })
    }
    if (!note.isPublic) {
      await NotesService._assertMember(userId, note.workspaceId)
    }
    return note
  },

  async update(noteId: string, userId: string, input: UpdateNoteInput) {
    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note) {
      throw Object.assign(new Error('Note introuvable'), { code: 'NOT_FOUND', status: 404 })
    }
    await NotesService._assertMember(userId, note.workspaceId)

    return prisma.note.update({
      where: { id: noteId },
      data:  {
        ...(input.title    !== undefined && { title:    input.title }),
        ...(input.content  !== undefined && { content:  input.content }),
        ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    })
  },

  async delete(noteId: string, userId: string) {
    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note) {
      throw Object.assign(new Error('Note introuvable'), { code: 'NOT_FOUND', status: 404 })
    }
    // Seul l'auteur ou admin peut supprimer
    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: note.workspaceId } },
    })
    const canDelete = note.authorId === userId ||
      member?.role === 'OWNER' || member?.role === 'ADMIN'
    if (!canDelete) {
      throw Object.assign(new Error('Accès refusé'), { code: 'FORBIDDEN', status: 403 })
    }
    await prisma.note.delete({ where: { id: noteId } })
    return { deleted: true }
  },

  // ── Helpers ───────────────────────────────────────────────────────────────
  async _assertMember(userId: string, workspaceId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    })
    if (!member) {
      throw Object.assign(new Error('Accès refusé'), { code: 'FORBIDDEN', status: 403 })
    }
    return member
  },
}
