import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import {
  listBranches, listCommits, listIssues, createIssue,
  closeIssue, listPRs, createPR,
} from '../../lib/git.api'
import type { GiteaRepo, GiteaIssue } from '../../lib/git.types'

type Tab = 'commits' | 'branches' | 'issues' | 'pulls'

interface RepoDetailProps {
  repo:    GiteaRepo
  onBack:  () => void
}

export function RepoDetail({ repo, onBack }: RepoDetailProps) {
  const queryClient = useQueryClient()
  const [tab,        setTab]        = useState<Tab>('commits')
  const [branch,     setBranch]     = useState(repo.default_branch)
  const [newIssue,   setNewIssue]   = useState({ title: '', body: '' })
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [newPR,      setNewPR]      = useState({ title: '', head: '', base: repo.default_branch })
  const [showPRForm, setShowPRForm] = useState(false)

  const owner = repo.owner.login

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', owner, repo.name],
    queryFn:  () => listBranches(owner, repo.name),
    enabled:  tab === 'branches' || tab === 'commits',
  })

  const { data: commits = [], isLoading: loadingCommits } = useQuery({
    queryKey: ['commits', owner, repo.name, branch],
    queryFn:  () => listCommits(owner, repo.name, branch),
    enabled:  tab === 'commits',
  })

  const { data: issues = [], isLoading: loadingIssues } = useQuery({
    queryKey: ['issues', owner, repo.name],
    queryFn:  () => listIssues(owner, repo.name),
    enabled:  tab === 'issues',
  })

  const { data: prs = [], isLoading: loadingPRs } = useQuery({
    queryKey: ['prs', owner, repo.name],
    queryFn:  () => listPRs(owner, repo.name),
    enabled:  tab === 'pulls',
  })

  const createIssueMutation = useMutation({
    mutationFn: () => createIssue(owner, repo.name, newIssue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', owner, repo.name] })
      setNewIssue({ title: '', body: '' })
      setShowIssueForm(false)
    },
  })

  const closeIssueMutation = useMutation({
    mutationFn: (issue: GiteaIssue) => closeIssue(owner, repo.name, issue.number),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['issues', owner, repo.name] }),
  })

  const createPRMutation = useMutation({
    mutationFn: () => createPR(owner, repo.name, newPR),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prs', owner, repo.name] })
      setNewPR({ title: '', head: '', base: repo.default_branch })
      setShowPRForm(false)
    },
  })

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'commits',  label: 'Commits',        icon: '🔀' },
    { id: 'branches', label: 'Branches',        icon: '🌿' },
    { id: 'issues',   label: 'Issues',          icon: '🐛' },
    { id: 'pulls',    label: 'Pull Requests',   icon: '↩️' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-800 px-6 py-4">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-base font-medium text-white">{repo.name}</h2>
          <p className="text-xs text-gray-500">{repo.full_name}</p>
        </div>
        <a href={repo.html_url} target="_blank" rel="noopener noreferrer"
          className="ml-auto text-xs text-brand-400 hover:text-brand-300 transition-colors"
          onClick={e => e.stopPropagation()}>
          Ouvrir dans Gitea ↗
        </a>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 transition-colors',
              tab === t.id
                ? 'border-brand-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200',
            )}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ── Commits ── */}
        {tab === 'commits' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <select value={branch} onChange={e => setBranch(e.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-brand-500">
                {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            {loadingCommits ? <Spinner /> : (
              <div className="flex flex-col gap-2">
                {commits.map(c => (
                  <div key={c.sha} className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900 p-4">
                    <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-xs flex-shrink-0">
                      {c.author?.avatar_url
                        ? <img src={c.author.avatar_url} className="h-8 w-8 rounded-full" alt="" />
                        : c.commit.author.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-100 font-medium truncate">{c.commit.message.split('\n')[0]}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {c.commit.author.name} · {new Date(c.commit.author.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <a href={c.html_url} target="_blank" rel="noopener noreferrer"
                      className="font-mono text-xs text-brand-400 hover:text-brand-300 flex-shrink-0">
                      {c.sha.slice(0, 7)}
                    </a>
                  </div>
                ))}
                {commits.length === 0 && <Empty text="Aucun commit" />}
              </div>
            )}
          </div>
        )}

        {/* ── Branches ── */}
        {tab === 'branches' && (
          <div className="flex flex-col gap-2">
            {branches.map(b => (
              <div key={b.name} className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
                <span className="text-green-400">🌿</span>
                <span className="text-sm font-medium text-gray-100">{b.name}</span>
                {b.name === repo.default_branch && (
                  <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-xs text-brand-300">défaut</span>
                )}
                <span className="ml-auto font-mono text-xs text-gray-500">{b.commit.id.slice(0, 7)}</span>
              </div>
            ))}
            {branches.length === 0 && <Empty text="Aucune branche" />}
          </div>
        )}

        {/* ── Issues ── */}
        {tab === 'issues' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowIssueForm(v => !v)}>+ Nouvelle issue</Button>
            </div>
            {showIssueForm && (
              <div className="rounded-xl border border-gray-700 bg-gray-900 p-5 flex flex-col gap-3">
                <Input label="Titre" value={newIssue.title} onChange={e => setNewIssue(f => ({ ...f, title: e.target.value }))} placeholder="Titre de l'issue" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-300">Description</label>
                  <textarea value={newIssue.body} onChange={e => setNewIssue(f => ({ ...f, body: e.target.value }))}
                    rows={3} placeholder="Description optionnelle…"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 outline-none focus:border-brand-500 resize-none" />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setShowIssueForm(false)}>Annuler</Button>
                  <Button loading={createIssueMutation.isPending} onClick={() => createIssueMutation.mutate()}>Créer</Button>
                </div>
              </div>
            )}
            {loadingIssues ? <Spinner /> : (
              <div className="flex flex-col gap-2">
                {issues.map(issue => (
                  <div key={issue.id} className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900 p-4">
                    <span className="text-lg mt-0.5">🐛</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <a href={issue.html_url} target="_blank" rel="noopener noreferrer"
                          className="text-sm font-medium text-gray-100 hover:text-brand-400 transition-colors">
                          #{issue.number} {issue.title}
                        </a>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        par {issue.user.login} · {new Date(issue.created_at).toLocaleDateString('fr-FR')} · {issue.comments} commentaires
                      </p>
                      {issue.labels.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {issue.labels.map(l => (
                            <span key={l.name} className="rounded-full px-2 py-0.5 text-xs text-white"
                              style={{ background: `#${l.color}` }}>{l.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="ghost"
                      loading={closeIssueMutation.isPending}
                      onClick={() => closeIssueMutation.mutate(issue)}>
                      Fermer
                    </Button>
                  </div>
                ))}
                {issues.length === 0 && <Empty text="Aucune issue ouverte 🎉" />}
              </div>
            )}
          </div>
        )}

        {/* ── Pull Requests ── */}
        {tab === 'pulls' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowPRForm(v => !v)}>+ Nouvelle PR</Button>
            </div>
            {showPRForm && (
              <div className="rounded-xl border border-gray-700 bg-gray-900 p-5 flex flex-col gap-3">
                <Input label="Titre" value={newPR.title} onChange={e => setNewPR(f => ({ ...f, title: e.target.value }))} placeholder="Titre de la PR" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-300">Branche source (head)</label>
                    <select value={newPR.head} onChange={e => setNewPR(f => ({ ...f, head: e.target.value }))}
                      className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-100 outline-none focus:border-brand-500">
                      <option value="">Sélectionner…</option>
                      {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-300">Branche cible (base)</label>
                    <select value={newPR.base} onChange={e => setNewPR(f => ({ ...f, base: e.target.value }))}
                      className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-100 outline-none focus:border-brand-500">
                      {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setShowPRForm(false)}>Annuler</Button>
                  <Button loading={createPRMutation.isPending} onClick={() => createPRMutation.mutate()}>Créer la PR</Button>
                </div>
              </div>
            )}
            {loadingPRs ? <Spinner /> : (
              <div className="flex flex-col gap-2">
                {prs.map(pr => (
                  <div key={pr.id} className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900 p-4">
                    <span className="text-lg mt-0.5">{pr.merged ? '✅' : '↩️'}</span>
                    <div className="flex-1 min-w-0">
                      <a href={pr.html_url} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-100 hover:text-brand-400 transition-colors">
                        #{pr.number} {pr.title}
                      </a>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {pr.head.ref} → {pr.base.ref} · par {pr.user.login} · {new Date(pr.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className={clsx('rounded-full px-2 py-0.5 text-xs', pr.merged
                      ? 'bg-purple-500/20 text-purple-300'
                      : pr.state === 'open' ? 'bg-green-500/20 text-green-300' : 'bg-gray-700 text-gray-400')}>
                      {pr.merged ? 'Mergée' : pr.state === 'open' ? 'Ouverte' : 'Fermée'}
                    </span>
                  </div>
                ))}
                {prs.length === 0 && <Empty text="Aucune pull request" />}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-700 border-t-brand-500" /></div>
}

function Empty({ text }: { text: string }) {
  return <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-600"><p className="text-sm">{text}</p></div>
}
