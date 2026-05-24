import { prisma } from '../../lib/prisma.js'
import type { CreateBoardInput, CreateTaskInput, UpdateTaskInput, ListTasksQuery } from './tasks.schema.js'

async function assertMember(userId: string, workspaceId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  })
  if (!member) throw Object.assign(new Error('Accès refusé'), { code: 'FORBIDDEN', status: 403 })
  return member
}

export const TasksService = {

  // ── Boards ──────────────────────────────────────────────────────────────

  async createBoard(input: CreateBoardInput & { userId: string }) {
    await assertMember(input.userId, input.workspaceId)
    return prisma.board.create({
      data:    { name: input.name, workspaceId: input.workspaceId },
      include: { _count: { select: { tasks: true } } },
    })
  },

  async listBoards(workspaceId: string, userId: string) {
    await assertMember(userId, workspaceId)
    return prisma.board.findMany({
      where:   { workspaceId },
      include: { _count: { select: { tasks: true } } },
      orderBy: { id: 'asc' },
    })
  },

  async deleteBoard(boardId: string, userId: string) {
    const board = await prisma.board.findUnique({ where: { id: boardId } })
    if (!board) throw Object.assign(new Error('Board introuvable'), { code: 'NOT_FOUND', status: 404 })
    const member = await assertMember(userId, board.workspaceId)
    if (!['OWNER', 'ADMIN'].includes(member.role)) {
      throw Object.assign(new Error('Seul un admin peut supprimer un board'), { code: 'FORBIDDEN', status: 403 })
    }
    await prisma.board.delete({ where: { id: boardId } })
    return { deleted: true }
  },

  // ── Tasks ────────────────────────────────────────────────────────────────

  async createTask(input: CreateTaskInput & { createdBy: string }) {
    await assertMember(input.createdBy, input.workspaceId)

    // Vérifier que le board appartient au workspace
    const board = await prisma.board.findFirst({
      where: { id: input.boardId, workspaceId: input.workspaceId },
    })
    if (!board) throw Object.assign(new Error('Board introuvable'), { code: 'NOT_FOUND', status: 404 })

    return prisma.task.create({
      data: {
        title:       input.title,
        description: input.description,
        status:      input.status,
        priority:    input.priority,
        boardId:     input.boardId,
        workspaceId: input.workspaceId,
        assigneeId:  input.assigneeId,
        dueDate:     input.dueDate,
      },
      include: {
        assignee: { select: { id: true, displayName: true, avatarUrl: true } },
        board:    { select: { id: true, name: true } },
      },
    })
  },

  async listTasks(query: ListTasksQuery & { userId: string }) {
    await assertMember(query.userId, query.workspaceId)
    return prisma.task.findMany({
      where: {
        workspaceId: query.workspaceId,
        ...(query.boardId    && { boardId:    query.boardId }),
        ...(query.status     && { status:     query.status }),
        ...(query.assigneeId && { assigneeId: query.assigneeId }),
      },
      include: {
        assignee: { select: { id: true, displayName: true, avatarUrl: true } },
        board:    { select: { id: true, name: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })
  },

  async getTask(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where:   { id: taskId },
      include: {
        assignee: { select: { id: true, displayName: true, avatarUrl: true } },
        board:    { select: { id: true, name: true } },
      },
    })
    if (!task) throw Object.assign(new Error('Tâche introuvable'), { code: 'NOT_FOUND', status: 404 })
    await assertMember(userId, task.workspaceId)
    return task
  },

  async updateTask(taskId: string, userId: string, input: UpdateTaskInput) {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) throw Object.assign(new Error('Tâche introuvable'), { code: 'NOT_FOUND', status: 404 })
    await assertMember(userId, task.workspaceId)

    return prisma.task.update({
      where: { id: taskId },
      data:  {
        ...(input.title       !== undefined && { title:       input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.status      !== undefined && { status:      input.status }),
        ...(input.priority    !== undefined && { priority:    input.priority }),
        ...(input.assigneeId  !== undefined && { assigneeId:  input.assigneeId }),
        ...(input.dueDate     !== undefined && { dueDate:     input.dueDate }),
      },
      include: {
        assignee: { select: { id: true, displayName: true, avatarUrl: true } },
        board:    { select: { id: true, name: true } },
      },
    })
  },

  async deleteTask(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) throw Object.assign(new Error('Tâche introuvable'), { code: 'NOT_FOUND', status: 404 })
    await assertMember(userId, task.workspaceId)
    await prisma.task.delete({ where: { id: taskId } })
    return { deleted: true }
  },
}
