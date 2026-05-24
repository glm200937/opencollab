import { api } from './api'
import type { GiteaRepo, GiteaBranch, GiteaCommit, GiteaIssue, GiteaPullRequest } from './git.types'

export type { GiteaRepo, GiteaBranch, GiteaCommit, GiteaIssue, GiteaPullRequest }

// Liaison compte Gitea
export const linkGiteaAccount = async (giteaUsername: string, giteaPassword: string) =>
  (await api.post<{ data: { linked: boolean; giteaUsername: string } }>('/git/link', { giteaUsername, giteaPassword })).data.data

// Repos
export const listRepos   = async (workspaceId: string) =>
  (await api.get<{ data: GiteaRepo[] }>(`/git/repos?workspaceId=${workspaceId}`)).data.data

export const createRepo  = async (data: { name: string; description?: string; isPrivate?: boolean; workspaceId: string }) =>
  (await api.post<{ data: GiteaRepo }>('/git/repos', data)).data.data

export const deleteRepo  = async (owner: string, repo: string) =>
  api.delete(`/git/repos/${owner}/${repo}`)

// Branches
export const listBranches = async (owner: string, repo: string) =>
  (await api.get<{ data: GiteaBranch[] }>(`/git/repos/${owner}/${repo}/branches`)).data.data

// Commits
export const listCommits = async (owner: string, repo: string, branch = 'main') =>
  (await api.get<{ data: GiteaCommit[] }>(`/git/repos/${owner}/${repo}/commits?branch=${branch}`)).data.data

// Issues
export const listIssues  = async (owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') =>
  (await api.get<{ data: GiteaIssue[] }>(`/git/repos/${owner}/${repo}/issues?state=${state}`)).data.data

export const createIssue = async (owner: string, repo: string, data: { title: string; body?: string }) =>
  (await api.post<{ data: GiteaIssue }>(`/git/repos/${owner}/${repo}/issues`, data)).data.data

export const closeIssue  = async (owner: string, repo: string, index: number) =>
  (await api.patch<{ data: GiteaIssue }>(`/git/repos/${owner}/${repo}/issues/${index}/close`, {})).data.data

// Pull Requests
export const listPRs     = async (owner: string, repo: string) =>
  (await api.get<{ data: GiteaPullRequest[] }>(`/git/repos/${owner}/${repo}/pulls`)).data.data

export const createPR    = async (owner: string, repo: string, data: { title: string; body?: string; head: string; base: string }) =>
  (await api.post<{ data: GiteaPullRequest }>(`/git/repos/${owner}/${repo}/pulls`, data)).data.data
