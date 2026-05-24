import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import type { TaskItem, TaskStatus, TaskPriority } from '../../lib/tasks.api'
import { PRIORITY_LABELS, STATUS_LABELS, COLUMNS } from '../../lib/tasks.api'

interface TaskModalProps {
  task?:        TaskItem | null   // null = création
  defaultStatus?: TaskStatus
  boardId:      string
  workspaceId:  string
  onSave:       (data: any) => Promise<void>
  onClose:      () => void
}

export function TaskModal({ task, defaultStatus, boardId, workspaceId, onSave, onClose }: TaskModalProps) {
  const [form, setForm] = useState({
    title:       task?.title       ?? '',
    description: task?.description ?? '',
    status:      task?.status      ?? defaultStatus ?? 'TODO' as TaskStatus,
    priority:    task?.priority    ?? 'MEDIUM' as TaskPriority,
    dueDate:     task?.dueDate ? task.dueDate.slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  // Fermer sur Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Le titre est requis'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        title:       form.title.trim(),
        description: form.description || undefined,
        status:      form.status,
        priority:    form.priority,
        dueDate:     form.dueDate || undefined,
        boardId,
        workspaceId,
      })
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h2 className="text-base font-medium text-white">
            {task ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <Input label="Titre" required value={form.title} onChange={set('title')} placeholder="Titre de la tâche" />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Description optionnelle…"
              rows={3}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Statut</label>
              <select value={form.status} onChange={set('status')}
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-100 outline-none focus:border-brand-500">
                {COLUMNS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Priorité</label>
              <select value={form.priority} onChange={set('priority')}
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-100 outline-none focus:border-brand-500">
                {(['LOW','MEDIUM','HIGH','URGENT'] as TaskPriority[]).map(p =>
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                )}
              </select>
            </div>
          </div>

          <Input label="Date d'échéance" type="date" value={form.dueDate} onChange={set('dueDate')} />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              {task ? 'Sauvegarder' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
