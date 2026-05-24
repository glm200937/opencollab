import { z } from 'zod'

export const CreateRepoSchema = z.object({
  name:        z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.-]+$/, 'Nom invalide'),
  description: z.string().max(500).optional(),
  isPrivate:   z.boolean().default(false),
  workspaceId: z.string().min(1),
})

export const RepoParamsSchema = z.object({
  owner: z.string().min(1),
  repo:  z.string().min(1),
})

export const CreateIssueSchema = z.object({
  title: z.string().min(1).max(255),
  body:  z.string().max(5000).optional(),
})

export const CreatePRSchema = z.object({
  title: z.string().min(1).max(255),
  body:  z.string().max(5000).optional(),
  head:  z.string().min(1),
  base:  z.string().min(1).default('main'),
})

export const IssueParamsSchema = z.object({
  owner: z.string().min(1),
  repo:  z.string().min(1),
  index: z.coerce.number().int().min(1),
})

export type CreateRepoInput  = z.infer<typeof CreateRepoSchema>
export type CreateIssueInput = z.infer<typeof CreateIssueSchema>
export type CreatePRInput    = z.infer<typeof CreatePRSchema>
