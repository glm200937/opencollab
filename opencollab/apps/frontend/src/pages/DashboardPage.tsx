import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'

const MODULES = [
  { path: '/files', icon: '📁', label: 'Fichiers',       desc: 'Upload, partage et versioning' },
  { path: '/notes', icon: '📝', label: 'Notes',          desc: 'Éditeur collaboratif temps réel' },
  { path: '/tasks', icon: '📋', label: 'Tâches',         desc: 'Kanban boards et organisation' },
  { path: '/chat',  icon: '💬', label: 'Chat',           desc: 'Messagerie temps réel par salon' },
  { path: '/git',   icon: '💻', label: 'Code',           desc: 'Dépôts Git, commits, issues, PRs' },
]

export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Bonjour, {user?.displayName ?? '…'} 👋
            </h1>
            <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>Déconnexion</Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((mod) => (
            <Link key={mod.path} to={mod.path}
              className="group rounded-xl border border-gray-800 bg-gray-900 p-5 transition-all duration-150 hover:border-gray-600 hover:bg-gray-800"
            >
              <div className="mb-3 text-3xl">{mod.icon}</div>
              <p className="font-medium text-white group-hover:text-brand-400 transition-colors">{mod.label}</p>
              <p className="mt-1 text-sm text-gray-500">{mod.desc}</p>
            </Link>
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-gray-700">
          OpenCollab v1.1.0 · open source · auto-hébergeable 🚀
        </p>
      </div>
    </div>
  )
}
