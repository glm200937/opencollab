import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'

const MODULES = [
  { path: '/files',  icon: '📁', label: 'Fichiers',     desc: 'Upload, partage et versioning' },
  { path: '/notes',  icon: '📝', label: 'Notes',        desc: 'Éditeur collaboratif temps réel' },
  { path: '/tasks',  icon: '📋', label: 'Tâches',       desc: 'Kanban boards et organisation' },
  { path: '/chat',   icon: '💬', label: 'Chat',         desc: 'Messagerie par workspace', soon: true },
]

export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-10">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Bonjour, {user?.displayName ?? '…'} 👋
            </h1>
            <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            Déconnexion
          </Button>
        </div>

        {/* Modules */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MODULES.map((mod) => (
            mod.soon ? (
              <div
                key={mod.path}
                className="relative rounded-xl border border-gray-800 bg-gray-900 p-5 opacity-50 cursor-not-allowed"
              >
                <span className="absolute right-3 top-3 rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-400">
                  Bientôt
                </span>
                <div className="mb-3 text-3xl">{mod.icon}</div>
                <p className="font-medium text-white">{mod.label}</p>
                <p className="mt-1 text-sm text-gray-500">{mod.desc}</p>
              </div>
            ) : (
              <Link
                key={mod.path}
                to={mod.path}
                className="group rounded-xl border border-gray-800 bg-gray-900 p-5 transition-all duration-150 hover:border-gray-600 hover:bg-gray-800"
              >
                <div className="mb-3 text-3xl">{mod.icon}</div>
                <p className="font-medium text-white group-hover:text-brand-400 transition-colors">
                  {mod.label}
                </p>
                <p className="mt-1 text-sm text-gray-500">{mod.desc}</p>
              </Link>
            )
          ))}
        </div>

        {/* Footer */}
        <p className="mt-12 text-center text-xs text-gray-700">
          OpenCollab v0.5.0 · open source · auto-hébergeable
        </p>
      </div>
    </div>
  )
}
