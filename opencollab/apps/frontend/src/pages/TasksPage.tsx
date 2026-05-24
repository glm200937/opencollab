import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { KanbanColumn } from '../components/tasks/KanbanColumn'
import { TaskModal } from '../components/tasks/TaskModal'
import { Button } from '../components/ui/Button'
import {
  listBoards, createBoard, listTasks, createTask, updateTask, deleteTask,
  COLUMNS,
} from '../lib/tasks.api'
import type { TaskItem, TaskStatus, BoardItem } from '../lib/tasks.api'

const DEMO_WORKSPACE_ID = 'demo-workspace'

export default function TasksPage() {
  const queryClient = useQueryClient()

  const [activeBoardId, setActiveBoardId] = useState<string | null>(null)
  const [draggingId,    setDraggingId]    = useState<string | null>(null)
  const [modal, setModal] = useState<{
    open: boolean; task?: TaskItem | null; defaultStatus?: TaskStatus
  }>({ open: false })
  const [newBoardName, setNewBoardName] = useState('')
  const [creatingBoard, setCreatingBoard] = useState(false)

  // ── Boards ────────────────────────────────────────────────────────────────
  const { data: boards = [], isLoading: loadingBoards } = useQuery({
    queryKey: ['boards', DEMO_WORKSPACE_ID],
    queryFn:  () => listBoards(DEMO_WORKSPACE_ID),
    onSuccess: (data: BoardItem[]) => { if (data.length > 0 && !activeBoardId) setActiveBoardId(data[0].id) },
  })

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks', DEMO_WORKSPACE_ID, activeBoardId],
    queryFn:  () => listTasks(DEMO_WORKSPACE_ID, activeBoardId ?? undefined),
    enabled:  !!activeBoardId,
  })

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardName.trim()) return
    setCreatingBoard(true)
    try {
      const board = await createBoard(newBoardName.trim(), DEMO_WORKSPACE_ID)
      queryClient.setQueryData(['boards', DEMO_WORKSPACE_ID], (old: BoardItem[] = []) => [...old, board])
      setActiveBoardId(board.id)
      setNewBoardName('')
    } finally {
      setCreatingBoard(false)
    }
  }

  const handleDrop = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Optimistic update
    queryClient.setQueryData(['tasks', DEMO_WORKSPACE_ID, activeBoardId], (old: TaskItem[] = []) =>
      old.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    )
    try {
      await updateTask(taskId, { status: newStatus })
    } catch {
      queryClient.invalidateQueries({ queryKey: ['tasks', DEMO_WORKSPACE_ID, activeBoardId] })
    }
  }

  const handleSaveTask = async (data: any) => {
    if (modal.task) {
      const updated = await updateTask(modal.task.id, data)
      queryClient.setQueryData(['tasks', DEMO_WORKSPACE_ID, activeBoardId], (old: TaskItem[] = []) =>
        old.map(t => t.id === modal.task!.id ? updated : t)
      )
    } else {
      const created = await createTask({ ...data, boardId: activeBoardId! })
      queryClient.setQueryData(['tasks', DEMO_WORKSPACE_ID, activeBoardId], (old: TaskItem[] = []) => [created, ...old])
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Supprimer cette tâche ?')) return
    await deleteTask(taskId)
    queryClient.setQueryData(['tasks', DEMO_WORKSPACE_ID, activeBoardId], (old: TaskItem[] = []) =>
      old.filter(t => t.id !== taskId)
    )
  }

  const tasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col bg-gray-950">

      {/* Topbar */}
      <div className="flex items-center gap-4 border-b border-gray-800 px-6 py-3">
        <h1 className="text-base font-medium text-white">Tâches</h1>

        {/* Sélecteur de board */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {loadingBoards ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-brand-500" />
          ) : (
            boards.map(board => (
              <button
                key={board.id}
                onClick={() => setActiveBoardId(board.id)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors whitespace-nowrap ${
                  activeBoardId === board.id
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {board.name}
                <span className="ml-1.5 text-xs opacity-60">{board._count.tasks}</span>
              </button>
            ))
          )}

          {/* Créer un board */}
          <form onSubmit={handleCreateBoard} className="flex items-center gap-1">
            <input
              value={newBoardName}
              onChange={e => setNewBoardName(e.target.value)}
              placeholder="+ Nouveau board"
              className="w-32 rounded-lg bg-transparent px-2 py-1.5 text-sm text-gray-400 placeholder:text-gray-600 outline-none focus:bg-gray-800 focus:text-gray-200 transition-colors"
            />
            {newBoardName && (
              <Button type="submit" size="sm" loading={creatingBoard}>OK</Button>
            )}
          </form>
        </div>

        <div className="ml-auto">
          <Button
            size="sm"
            onClick={() => setModal({ open: true, task: null })}
            disabled={!activeBoardId}
          >
            + Tâche
          </Button>
        </div>
      </div>

      {/* Kanban board */}
      {!activeBoardId ? (
        <div className="flex flex-1 items-center justify-center text-gray-600">
          <div className="text-center">
            <span className="text-4xl">📋</span>
            <p className="mt-2 text-sm">Créez votre premier board ci-dessus</p>
          </div>
        </div>
      ) : loadingTasks ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-700 border-t-brand-500" />
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto p-6">
          {COLUMNS.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus(status)}
              onDrop={handleDrop}
              onEdit={(task) => setModal({ open: true, task })}
              onDelete={handleDeleteTask}
              onAddTask={(s) => setModal({ open: true, task: null, defaultStatus: s })}
              draggingId={draggingId}
              setDragging={setDraggingId}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && activeBoardId && (
        <TaskModal
          task={modal.task}
          defaultStatus={modal.defaultStatus}
          boardId={activeBoardId}
          workspaceId={DEMO_WORKSPACE_ID}
          onSave={handleSaveTask}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
