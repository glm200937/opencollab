// ─── Users & Auth ────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// ─── Workspaces ───────────────────────────────────────────────────────────────
export interface Workspace {
  id: string
  name: string
  slug: string
  ownerId: string
  members: WorkspaceMember[]
  createdAt: Date
}

export interface WorkspaceMember {
  userId: string
  workspaceId: string
  role: WorkspaceRole
  joinedAt: Date
}

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'

// ─── Files ────────────────────────────────────────────────────────────────────
export interface FileAsset {
  id: string
  name: string
  mimeType: string
  size: number
  url: string
  workspaceId: string
  uploadedBy: string
  createdAt: Date
}

// ─── Notes ───────────────────────────────────────────────────────────────────
export interface Note {
  id: string
  title: string
  content: string
  workspaceId: string
  authorId: string
  parentId?: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId?: string
  workspaceId: string
  boardId: string
  dueDate?: Date
  createdAt: Date
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

// ─── Chat ─────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  content: string
  authorId: string
  channelId: string
  createdAt: Date
  editedAt?: Date
}

export interface ChatChannel {
  id: string
  name: string
  workspaceId: string
  isPrivate: boolean
  memberIds: string[]
}

// ─── API wrappers ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  code: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}
