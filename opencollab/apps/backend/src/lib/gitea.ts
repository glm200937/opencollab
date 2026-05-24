/**
 * Client Gitea — wrapper autour de l'API REST Gitea v1
 * Doc : https://gitea.io/api/swagger
 */

const GITEA_URL   = process.env.GITEA_URL         ?? 'http://localhost:3000'
const ADMIN_TOKEN = process.env.GITEA_ADMIN_TOKEN  ?? ''

async function giteaFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const res = await fetch(`${GITEA_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `token ${token ?? ADMIN_TOKEN}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw Object.assign(
      new Error(err.message ?? `Gitea API error ${res.status}`),
      { code: 'GITEA_ERROR', status: res.status },
    )
  }

  // 204 No Content
  if (res.status === 204) return {} as T
  return res.json()
}

// ── Types Gitea ───────────────────────────────────────────────────────────────
export interface GiteaRepo {
  id:            number
  name:          string
  full_name:     string
  description:   string
  private:       boolean
  html_url:      string
  clone_url:     string
  ssh_url:       string
  default_branch: string
  stars_count:   number
  forks_count:   number
  open_issues_count: number
  updated_at:    string
  owner:         { login: string; avatar_url: string }
}

export interface GiteaBranch {
  name:   string
  commit: { id: string; message: string; added: null; timestamp: string }
}

export interface GiteaCommit {
  sha:    string
  html_url: string
  commit: {
    message:   string
    author:    { name: string; email: string; date: string }
    committer: { name: string; email: string; date: string }
  }
  author:    { login: string; avatar_url: string } | null
}

export interface GiteaIssue {
  id:         number
  number:     number
  title:      string
  body:       string
  state:      'open' | 'closed'
  html_url:   string
  labels:     { name: string; color: string }[]
  assignees:  { login: string; avatar_url: string }[]
  created_at: string
  updated_at: string
  user:       { login: string; avatar_url: string }
  comments:   number
}

export interface GiteaPullRequest {
  id:         number
  number:     number
  title:      string
  body:       string
  state:      'open' | 'closed'
  html_url:   string
  head:       { label: string; sha: string; ref: string }
  base:       { label: string; sha: string; ref: string }
  merged:     boolean
  created_at: string
  user:       { login: string; avatar_url: string }
}

// ── Repos ─────────────────────────────────────────────────────────────────────
export const GiteaClient = {

  async createUser(opts: { username: string; email: string; password: string }) {
    return giteaFetch('/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        username:             opts.username,
        email:                opts.email,
        password:             opts.password,
        must_change_password: false,
        login_name:           opts.username,
        source_id:            0,
      }),
    })
  },

  async getUserToken(username: string, password: string): Promise<string> {
    const tokenName = `opencollab-${Date.now()}`
    const res = await giteaFetch<{ sha1: string }>(
      `/users/${username}/tokens`,
      {
        method: 'POST',
        body: JSON.stringify({ name: tokenName }),
        headers: {
          Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        },
      },
    )
    return res.sha1
  },

  // ── Repositories ────────────────────────────────────────────────────────
  async listRepos(username: string, token: string): Promise<GiteaRepo[]> {
    return giteaFetch(`/users/${username}/repos?limit=50`, {}, token)
  },

  async createRepo(opts: {
    name: string; description?: string; private?: boolean; auto_init?: boolean
  }, token: string): Promise<GiteaRepo> {
    return giteaFetch('/user/repos', {
      method: 'POST',
      body: JSON.stringify({
        name:        opts.name,
        description: opts.description ?? '',
        private:     opts.private ?? false,
        auto_init:   opts.auto_init ?? true,
        default_branch: 'main',
      }),
    }, token)
  },

  async deleteRepo(owner: string, repo: string, token: string): Promise<void> {
    return giteaFetch(`/repos/${owner}/${repo}`, { method: 'DELETE' }, token)
  },

  async getRepo(owner: string, repo: string, token: string): Promise<GiteaRepo> {
    return giteaFetch(`/repos/${owner}/${repo}`, {}, token)
  },

  // ── Branches ────────────────────────────────────────────────────────────
  async listBranches(owner: string, repo: string, token: string): Promise<GiteaBranch[]> {
    return giteaFetch(`/repos/${owner}/${repo}/branches`, {}, token)
  },

  // ── Commits ─────────────────────────────────────────────────────────────
  async listCommits(owner: string, repo: string, branch: string, token: string, limit = 20): Promise<GiteaCommit[]> {
    return giteaFetch(`/repos/${owner}/${repo}/commits?sha=${branch}&limit=${limit}`, {}, token)
  },

  // ── Issues ──────────────────────────────────────────────────────────────
  async listIssues(owner: string, repo: string, token: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GiteaIssue[]> {
    return giteaFetch(`/repos/${owner}/${repo}/issues?type=issues&state=${state}&limit=50`, {}, token)
  },

  async createIssue(owner: string, repo: string, opts: {
    title: string; body?: string; assignees?: string[]
  }, token: string): Promise<GiteaIssue> {
    return giteaFetch(`/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      body: JSON.stringify(opts),
    }, token)
  },

  async closeIssue(owner: string, repo: string, index: number, token: string): Promise<GiteaIssue> {
    return giteaFetch(`/repos/${owner}/${repo}/issues/${index}`, {
      method: 'PATCH',
      body: JSON.stringify({ state: 'closed' }),
    }, token)
  },

  // ── Pull Requests ────────────────────────────────────────────────────────
  async listPullRequests(owner: string, repo: string, token: string, state: 'open' | 'closed' = 'open'): Promise<GiteaPullRequest[]> {
    return giteaFetch(`/repos/${owner}/${repo}/pulls?state=${state}&limit=50`, {}, token)
  },

  async createPullRequest(owner: string, repo: string, opts: {
    title: string; body?: string; head: string; base: string
  }, token: string): Promise<GiteaPullRequest> {
    return giteaFetch(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify(opts),
    }, token)
  },
}
