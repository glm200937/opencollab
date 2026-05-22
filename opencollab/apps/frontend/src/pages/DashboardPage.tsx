import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'

export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-950">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-white">
          Bonjour, {user?.displayName ?? '…'} 👋
        </h1>
        <p className="mt-2 text-gray-400">{user?.email}</p>
      </div>
      <Button variant="ghost" onClick={logout}>
        Se déconnecter
      </Button>
    </div>
  )
}
