import { clsx } from 'clsx'
import type { GiteaRepo } from '../../lib/git.types'

interface RepoCardProps {
  repo:     GiteaRepo
  onSelect: (repo: GiteaRepo) => void
  onDelete: (repo: GiteaRepo) => void
}

export function RepoCard({ repo, onSelect, onDelete }: RepoCardProps) {
  return (
    <div
      onClick={() => onSelect(repo)}
      className="group cursor-pointer rounded-xl border border-gray-800 bg-gray-900 p-5 transition-all hover:border-gray-600 hover:bg-gray-800"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">📦</span>
          <div className="min-w-0">
            <p className="font-medium text-white truncate group-hover:text-brand-400 transition-colors">
              {repo.name}
            </p>
            <p className="text-xs text-gray-500">{repo.full_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {repo.private && (
            <span className="rounded-full border border-gray-700 px-2 py-0.5 text-xs text-gray-400">
              🔒 Privé
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(repo) }}
            className="hidden group-hover:flex rounded p-1 text-gray-500 hover:text-red-400 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {repo.description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{repo.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>⭐ {repo.stars_count}</span>
        <span>🍴 {repo.forks_count}</span>
        <span>🐛 {repo.open_issues_count} issues</span>
        <span className="ml-auto">
          {new Date(repo.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
        </span>
      </div>
    </div>
  )
}
