import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export default function RegisterPage() {
  const { register, isRegistering, registerError } = useAuth()
  const [form, setForm] = useState({
    email: '', username: '', displayName: '', password: '', confirm: '',
  })
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    if (form.password !== form.confirm) {
      setLocalError('Les mots de passe ne correspondent pas')
      return
    }
    register({
      email:       form.email,
      username:    form.username,
      displayName: form.displayName,
      password:    form.password,
    })
  }

  const errorMsg = localError
    ?? (registerError ? (registerError as any)?.response?.data?.error ?? 'Une erreur est survenue' : null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white">Créer un compte</h1>
          <p className="mt-1 text-sm text-gray-400">Rejoignez OpenCollab</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMsg && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          <Input
            label="Nom d'affichage"
            placeholder="Jean Dupont"
            required
            value={form.displayName}
            onChange={(e) => setForm(f => ({ ...f, displayName: e.target.value }))}
          />

          <Input
            label="Nom d'utilisateur"
            placeholder="jean_dupont"
            required
            hint="Lettres minuscules, chiffres, _ et - uniquement"
            value={form.username}
            onChange={(e) => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
          />

          <Input
            label="Email"
            type="email"
            placeholder="vous@exemple.com"
            required
            value={form.email}
            onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
          />

          <Input
            label="Mot de passe"
            type="password"
            placeholder="Minimum 8 caractères"
            required
            value={form.password}
            onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            placeholder="••••••••"
            required
            value={form.confirm}
            onChange={(e) => setForm(f => ({ ...f, confirm: e.target.value }))}
          />

          <Button type="submit" loading={isRegistering} className="mt-2 w-full" size="lg">
            Créer mon compte
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
