import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RepoCard } from '../components/git/RepoCard'
import { RepoDetail } from '../components/git/RepoDetail'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { listRepos, createRepo, deleteRepo, linkGiteaAccount } from '../lib/git.api'
import type { GiteaRepo } from '../lib/git.types'

const DEMO_WORKSPACE_ID = 'demo-workspace'

export default function GitPage() {
  const queryClient = useQueryClient()
  const [activeRepo,   setActiveRepo]   = useState<GiteaRepo | null>(null)
  const [showCreate,   setShowCreate]   = useState(false)
  const [showLink,     setShowLink]     = useState(false)
  const [newRepo,      setNewRepo]      = useState({ name: '', description: '', isPrivate: false })
  const [giteaCreds,   setGiteaCreds]   = useState({ username: '', password: '' })
  const [linkError,    setLinkError]    = useState<string | null>(null)

  const { data: repos = [], isLoading, error } = useQuery({
    queryKey: ['repos', DEMO_WORKSPACE_ID],
    queryFn:  () => listRepos(DEMO_WORKSPACE_ID),
    retry:    false,
  })

  const isNotLinked = (error as any)?.response?.data?.code === 'GITEA_NOT_LINKED'

  const createMutation = useMutation({
    mutationFn: () => createRepo({ ...newRepo, workspaceId: DEMO_WORKSPACE_ID }),
    onSuccess: (repo) => {
      queryClient.setQueryData(['repos', DEMO_WORKSPACE_ID], (old: GiteaRepo[] = []) => [repo, ...old])
      setNewRepo({ name: '', description: '', isPrivate: false })
      setShowCreate(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (repo: GiteaRepo) => deleteRepo(repo.owner.login, repo.name),
    onSuccess: (_, repo) => {
      queryClient.setQueryData(['repos', DEMO_WORKSPACE_ID], (old: GiteaRepo[] = []) =>
        old.filter(r => r.id !== repo.id))
    },
  })

  const linkMutation = useMutation({
    mutationFn: () => linkGiteaAccount(giteaCreds.username, giteaCreds.password),
    onSuccess: () => {
      setShowLink(false)
      setLinkError(null)
      queryClient.invalidateQueries({ queryKey: ['repos', DEMO_WORKSPACE_ID] })
    },
    onError: (e: any) => setLinkError(e?.response?.data?.error ?? 'Erreur de liaison'),
  })

  const handleDelete = async (repo: GiteaRepo) => {
    if (!confirm(`Supprimer le dépôt "${repo.name}" ? Cette action est irréversible.`)) return
    deleteMutation.mutate(repo)
  }

  if (activeRepo) {
    return (
      <div className="h-screen bg-gray-950 overflow-hidden">
        <RepoDetail repo={activeRepo} onBack={() => setActiveRepo(null)} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Code</h1>
            <p className="mt-1 text-sm text-gray-500">{repos.length} dépôt{repos.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowLink(v => !v)}>
              🔗 Lier Gitea
            </Button>
            <Button size="sm" onClick={() => setShowCreate(v => !v)} disabled={isNotLinked}>
              + Nouveau dépôt
            </Button>
          </div>
        </div>

        {/* Formulaire liaison Gitea */}
        {showLink && (
          <div className="mb-6 rounded-xl border border-gray-700 bg-gray-900 p-5 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Lier votre compte Gitea</h3>
              <p className="text-xs text-gray-500">
                Entrez vos identifiants Gitea (http://localhost:3000). Un token sera généré automatiquement.
              </p>
            </div>
            {linkError && <p className="text-sm text-red-400">{linkError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Input label="Nom d'utilisateur Gitea" value={giteaCreds.username}
                onChange={e => setGiteaCreds(f => ({ ...f, username: e.target.value }))} placeholder="admin" />
              <Input label="Mot de passe" type="password" value={giteaCreds.password}
                onChange={e => setGiteaCreds(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowLink(false)}>Annuler</Button>
              <Button loading={linkMutation.isPending} onClick={() => linkMutation.mutate()}>Lier le compte</Button>
            </div>
          </div>
        )}

        {/* Formulaire création dépôt */}
        {showCreate && (
          <div className="mb-6 rounded-xl border border-gray-700 bg-gray-900 p-5 flex flex-col gap-4">
            <h3 className="text-sm font-medium text-white">Nouveau dépôt</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Nom du dépôt" value={newRepo.name}
                onChange={e => setNewRepo(f => ({ ...f, name: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                placeholder="mon-projet" hint="Minuscules, chiffres et tirets" />
              <Input label="Description" value={newRepo.description}
                onChange={e => setNewRepo(f => ({ ...f, description: e.target.value }))}
                placeholder="Description optionnelle" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={newRepo.isPrivate}
                onChange={e => setNewRepo(f => ({ ...f, isPrivate: e.target.checked }))}
                className="rounded border-gray-600 bg-gray-800 text-brand-500" />
              <span className="text-sm text-gray-300">Dépôt privé 🔒</span>
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Créer</Button>
            </div>
          </div>
        )}

        {/* Compte non lié */}
        {isNotLinked && (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <span className="text-5xl">🔗</span>
            <h2 className="text-lg font-medium text-white">Compte Gitea non lié</h2>
            <p className="text-sm text-gray-500 max-w-sm">
              Liez votre compte Gitea pour accéder à vos dépôts, commits, issues et pull requests.
            </p>
            <Button onClick={() => setShowLink(true)}>Lier mon compte Gitea</Button>
          </div>
        )}

        {/* Liste repos */}
        {!isNotLinked && (
          isLoading ? (
            <div className="flex justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-brand-500" />
            </div>
          ) : repos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-600">
              <span className="text-5xl">📦</span>
              <p className="text-sm">Aucun dépôt. Créez-en un !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {repos.map(repo => (
                <RepoCard key={repo.id} repo={repo} onSelect={setActiveRepo} onDelete={handleDelete} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
