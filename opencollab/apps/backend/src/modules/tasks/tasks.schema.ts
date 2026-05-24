import { z } from 'zod'

export const CreateBoardSchema = z.object({
  name:        z.string().min(1).max(100),
  workspaceId: z.string().min(1),
})

export const CreateTaskSchema = z.object({
  title:       z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  boardId:     z.string().min(1),
  workspaceId: z.string().min(1),
  status:      z.enum(['BACKLOG','TODO','IN_PROGRESS','IN_REVIEW','DONE']).default('TODO'),
  priority:    z.enum(['LOW','MEDIUM','HIGH','URGENT']).default('MEDIUM'),
  assigneeId:  z.string().optional(),
  dueDate:     z.coerce.date().optional(),
})

export const UpdateTaskSchema = z.object({
  title:       z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  status:      z.enum(['BACKLOG','TODO','IN_PROGRESS','IN_REVIEW','DONE']).optional(),
  priority:    z.enum(['LOW','MEDIUM','HIGH','URGENT']).optional(),
  assigneeId:  z.string().nullable().optional(),
  dueDate:     z.coerce.date().nullable().optional(),
})

export const TaskParamsSchema  = z.object({ taskId:  z.string().min(1) })
export const BoardParamsSchema = z.object({ boardId: z.string().min(1) })

export const ListTasksQuerySchema = z.object({
  workspaceId: z.string().min(1),
  boardId:     z.string().optional(),
  status:      z.enum(['BACKLOG','TODO','IN_PROGRESS','IN_REVIEW','DONE']).optional(),
  assigneeId:  z.string().optional(),
})

export type CreateBoardInput = z.infer<typeof CreateBoardSchema>
export type CreateTaskInput  = z.infer<typeof CreateTaskSchema>
export type UpdateTaskInput  = z.infer<typeof UpdateTaskSchema>
export type ListTasksQuery   = z.infer<typeof ListTasksQuerySchema>
