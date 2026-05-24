import { clsx } from 'clsx'
import type { TaskItem } from '../../lib/tasks.api'
import { PRIORITY_COLORS, PRIORITY_ICONS, PRIORITY_LABELS } from '../../lib/tasks.api'

interface TaskCardProps {
  task:       TaskItem
  onEdit:     (task: TaskItem) => void
  onDelete:   (taskId: string) => void
  isDragging: boolean
}

export function TaskCard({ task, onEdit, onDelete, isDragging }: TaskCardProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'

  return (
    <div
      draggable
      className={clsx(
        'group rounded-lg border border-gray-700 bg-gray-800 p-3 cursor-grab active:cursor-grabbing',
        'transition-all duration-150 hover:border-gray-600',
        isDragging && 'opacity-40 scale-95',
      )}
      onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
    >
      {/* Priorité + actions */}
      <div className="flex items-center justify-between mb-2">
        <span className={clsx('text-xs font-medium', PRIORITY_COLORS[task.priority])}>
          {PRIORITY_ICONS[task.priority]} {PRIORITY_LABELS[task.priority]}
        </span>
        <div className="hidden group-hover:flex items-center gap-1">
          <button
            onClick={() => onEdit(task)}
            className="rounded p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="rounded p-0.5 text-gray-500 hover:text-red-400 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Titre */}
      <p className="text-sm font-medium text-gray-100 leading-snug mb-2">
        {task.title}
      </p>

      {/* Description (tronquée) */}
      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{task.description}</p>
      )}

      {/* Footer : assignee + due date */}
      <div className="flex items-center justify-between mt-2">
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-brand-600 flex items-center justify-center text-xs text-white font-medium">
              {task.assignee.displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-gray-500 truncate max-w-[80px]">
              {task.assignee.displayName}
            </span>
          </div>
        ) : <div />}

        {task.dueDate && (
          <span className={clsx('text-xs', isOverdue ? 'text-red-400 font-medium' : 'text-gray-500')}>
            {isOverdue && '⚠ '}
            {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  )
}
