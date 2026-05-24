import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate.js'
import { TasksService } from './tasks.service.js'
import {
  CreateBoardSchema, CreateTaskSchema, UpdateTaskSchema,
  TaskParamsSchema, BoardParamsSchema, ListTasksQuerySchema,
} from './tasks.schema.js'

export async function tasksRoutes(app: FastifyInstance) {

  // ── Boards ────────────────────────────────────────────────────────────────
  app.post('/boards', { preHandler: authenticate }, async (req, reply) => {
    const r = CreateBoardSchema.safeParse(req.body)
    if (!r.success) return reply.status(400).send({ error: 'Validation échouée', code: 'VALIDATION_ERROR', details: r.error.flatten().fieldErrors })
    try {
      const board = await TasksService.createBoard({ ...r.data, userId: req.userId })
      return reply.status(201).send({ data: board })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  app.get('/boards', { preHandler: authenticate }, async (req, reply) => {
    const { workspaceId } = req.query as { workspaceId?: string }
    if (!workspaceId) return reply.status(400).send({ error: 'workspaceId requis', code: 'VALIDATION_ERROR' })
    try {
      const boards = await TasksService.listBoards(workspaceId, req.userId)
      return reply.send({ data: boards })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  app.delete('/boards/:boardId', { preHandler: authenticate }, async (req, reply) => {
    const p = BoardParamsSchema.safeParse(req.params)
    if (!p.success) return reply.status(400).send({ error: 'boardId invalide', code: 'VALIDATION_ERROR' })
    try {
      const result = await TasksService.deleteBoard(p.data.boardId, req.userId)
      return reply.send({ data: result })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  // ── Tasks ─────────────────────────────────────────────────────────────────
  app.post('/', { preHandler: authenticate }, async (req, reply) => {
    const r = CreateTaskSchema.safeParse(req.body)
    if (!r.success) return reply.status(400).send({ error: 'Validation échouée', code: 'VALIDATION_ERROR', details: r.error.flatten().fieldErrors })
    try {
      const task = await TasksService.createTask({ ...r.data, createdBy: req.userId })
      return reply.status(201).send({ data: task })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  app.get('/', { preHandler: authenticate }, async (req, reply) => {
    const r = ListTasksQuerySchema.safeParse(req.query)
    if (!r.success) return reply.status(400).send({ error: 'Paramètres invalides', code: 'VALIDATION_ERROR' })
    try {
      const tasks = await TasksService.listTasks({ ...r.data, userId: req.userId })
      return reply.send({ data: tasks })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  app.get('/:taskId', { preHandler: authenticate }, async (req, reply) => {
    const p = TaskParamsSchema.safeParse(req.params)
    if (!p.success) return reply.status(400).send({ error: 'taskId invalide', code: 'VALIDATION_ERROR' })
    try {
      const task = await TasksService.getTask(p.data.taskId, req.userId)
      return reply.send({ data: task })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  app.patch('/:taskId', { preHandler: authenticate }, async (req, reply) => {
    const p = TaskParamsSchema.safeParse(req.params)
    const b = UpdateTaskSchema.safeParse(req.body)
    if (!p.success || !b.success) return reply.status(400).send({ error: 'Paramètres invalides', code: 'VALIDATION_ERROR' })
    try {
      const task = await TasksService.updateTask(p.data.taskId, req.userId, b.data)
      return reply.send({ data: task })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  app.delete('/:taskId', { preHandler: authenticate }, async (req, reply) => {
    const p = TaskParamsSchema.safeParse(req.params)
    if (!p.success) return reply.status(400).send({ error: 'taskId invalide', code: 'VALIDATION_ERROR' })
    try {
      const result = await TasksService.deleteTask(p.data.taskId, req.userId)
      return reply.send({ data: result })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })
}
