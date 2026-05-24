import { api } from './api'

export type TaskStatus   = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface BoardItem {
  id:          string
  name:        string
  workspaceId: string
  _count:      { tasks: number }
}

export interface TaskItem {
  id:          string
  title:       string
  description: string | null
  status:      TaskStatus
  priority:    TaskPriority
  boardId:     string
  workspaceId: string
  assigneeId:  string | null
  dueDate:     string | null
  createdAt:   string
  assignee:    { id: string; displayName: string; avatarUrl?: string } | null
  board:       { id: string; name: string }
}

// Boards
export const listBoards   = async (workspaceId: string) =>
  (await api.get<{ data: BoardItem[] }>(`/tasks/boards?workspaceId=${workspaceId}`)).data.data

export const createBoard  = async (name: string, workspaceId: string) =>
  (await api.post<{ data: BoardItem }>('/tasks/boards', { name, workspaceId })).data.data

export const deleteBoard  = async (boardId: string) =>
  api.delete(`/tasks/boards/${boardId}`)

// Tasks
export const listTasks    = async (workspaceId: string, boardId?: string) => {
  const params = new URLSearchParams({ workspaceId })
  if (boardId) params.set('boardId', boardId)
  return (await api.get<{ data: TaskItem[] }>(`/tasks?${params}`)).data.data
}

export const createTask   = async (data: {
  title: string; boardId: string; workspaceId: string
  description?: string; priority?: TaskPriority; assigneeId?: string; dueDate?: string
}) => (await api.post<{ data: TaskItem }>('/tasks', data)).data.data

export const updateTask   = async (taskId: string, data: Partial<{
  title: string; description: string; status: TaskStatus
  priority: TaskPriority; assigneeId: string | null; dueDate: string | null
}>) => (await api.patch<{ data: TaskItem }>(`/tasks/${taskId}`, data)).data.data

export const deleteTask   = async (taskId: string) => api.delete(`/tasks/${taskId}`)

// Helpers UI
export const STATUS_LABELS: Record<TaskStatus, string> = {
  BACKLOG:     'Backlog',
  TODO:        'À faire',
  IN_PROGRESS: 'En cours',
  IN_REVIEW:   'En revue',
  DONE:        'Terminé',
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  BACKLOG:     'bg-gray-700 text-gray-300',
  TODO:        'bg-blue-500/20 text-blue-300',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-300',
  IN_REVIEW:   'bg-purple-500/20 text-purple-300',
  DONE:        'bg-green-500/20 text-green-300',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Basse', MEDIUM: 'Moyenne', HIGH: 'Haute', URGENT: 'Urgente',
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW:    'text-gray-400',
  MEDIUM: 'text-blue-400',
  HIGH:   'text-orange-400',
  URGENT: 'text-red-400',
}

export const PRIORITY_ICONS: Record<TaskPriority, string> = {
  LOW: '↓', MEDIUM: '→', HIGH: '↑', URGENT: '⚡',
}

export const COLUMNS: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']
