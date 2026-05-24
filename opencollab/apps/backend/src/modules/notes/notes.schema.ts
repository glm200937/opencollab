import { z } from 'zod'

export const CreateNoteSchema = z.object({
  title:       z.string().min(1).max(255),
  workspaceId: z.string().min(1),
  parentId:    z.string().optional(),
  isPublic:    z.boolean().default(false),
})

export const UpdateNoteSchema = z.object({
  title:    z.string().min(1).max(255).optional(),
  content:  z.any().optional(),   // JSON TipTap
  isPublic: z.boolean().optional(),
})

export const NoteParamsSchema = z.object({
  noteId: z.string().min(1),
})

export const ListNotesQuerySchema = z.object({
  workspaceId: z.string().min(1),
  parentId:    z.string().optional(),
})

export type CreateNoteInput  = z.infer<typeof CreateNoteSchema>
export type UpdateNoteInput  = z.infer<typeof UpdateNoteSchema>
export type ListNotesQuery   = z.infer<typeof ListNotesQuerySchema>
