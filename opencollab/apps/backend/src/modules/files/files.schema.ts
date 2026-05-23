import { z } from 'zod'

export const UploadQuerySchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId requis'),
})

export const FileParamsSchema = z.object({
  fileId: z.string().min(1),
})

export const ListFilesQuerySchema = z.object({
  workspaceId: z.string().min(1),
  page:        z.coerce.number().int().min(1).default(1),
  perPage:     z.coerce.number().int().min(1).max(100).default(20),
})

// Types MIME autorisés
export const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'text/plain', 'text/markdown', 'text/csv',
  'application/json',
  'application/zip', 'application/x-tar',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav',
] as const

export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB

export type UploadQuery     = z.infer<typeof UploadQuerySchema>
export type ListFilesQuery  = z.infer<typeof ListFilesQuerySchema>
