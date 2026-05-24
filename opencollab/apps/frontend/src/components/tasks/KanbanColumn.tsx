import { useState } from 'react'
import { clsx } from 'clsx'
import { TaskCard } from './TaskCard'
import type { TaskItem, TaskStatus } from '../../lib/tasks.api'
import { STATUS_LABELS, STATUS_COLORS } from '../../lib/tasks.api'

interface KanbanColumnProps {
  status:      TaskStatus
  tasks:       TaskItem[]
  onDrop:      (taskId: string, newStatus: TaskStatus) => void
  onEdit:      (task: TaskItem) => void
  onDelete:    (taskId: string) => void
  onAddTask:   (status: TaskStatus) => void
  draggingId:  string | null
  setDragging: (id: string | null) => void
}

export function KanbanColumn({
  status, tasks, onDrop, onEdit, onDelete, onAddTask, draggingId, setDragging,
}: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false)

  return (
    <div
      className={clsx(
        'flex h-full w-64 flex-shrink-0 flex-col rounded-xl border transition-colors duration-150',
        isOver ? 'border-brand-500 bg-brand-500/5' : 'border-gray-800 bg-gray-900',
      )}
      onDragOver={(e) => { e.preventDefault(); setIsOver(true) }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsOver(false)
        const taskId = e.dataTransfer.getData('taskId')
        if (taskId) { onDrop(taskId, status); setDragging(null) }
      }}
    >
      {/* Header colonne */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[status])}>
            {STATUS_LABELS[status]}
          </span>
          <span className="text-xs text-gray-500">{tasks.length}</span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
          title="Ajouter une tâche"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Tâches */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {tasks.length === 0 && (
          <div className={clsx(
            'flex items-center justify-center rounded-lg border-2 border-dashed py-8 transition-colors',
            isOver ? 'border-brand-500/50' : 'border-gray-800',
          )}>
            <span className="text-xs text-gray-600">Déposez ici</span>
          </div>
        )}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            isDragging={draggingId === task.id}
          />
        ))}
      </div>
    </div>
  )
}
