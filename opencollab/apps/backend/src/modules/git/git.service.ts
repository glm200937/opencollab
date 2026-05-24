import { prisma } from '../../lib/prisma.js'
import { GiteaClient } from '../../lib/gitea.js'
import type { CreateRepoInput, CreateIssueInput, CreatePRInput } from './git.schema.js'

// Récupérer le token Gitea stocké pour un utilisateur
async function getGiteaToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { giteaToken: true, username: true },
  })
  if (!user?.giteaToken) {
    throw Object.assign(
      new Error('Compte Gitea non lié. Connectez votre compte dans les paramètres.'),
      { code: 'GITEA_NOT_LINKED', status: 400 },
    )
  }
  return user.giteaToken
}

async function assertMember(userId: string, workspaceId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  })
  if (!member) throw Object.assign(new Error('Accès refusé'), { code: 'FORBIDDEN', status: 403 })
  return member
}

export const GitService = {

  // ── Liaison compte Gitea ──────────────────────────────────────────────────
  async linkGiteaAccount(userId: string, giteaUsername: string, giteaPassword: string) {
    // Obtenir un token Gitea pour cet utilisateur
    const token = await GiteaClient.getUserToken(giteaUsername, giteaPassword)

    // Stocker le token en base
    await prisma.user.update({
      where: { id: userId },
      data:  { giteaToken: token, giteaUsername },
    })
    return { linked: true, giteaUsername }
  },

  // ── Repos ─────────────────────────────────────────────────────────────────
  async listRepos(userId: string, workspaceId: string) {
    await assertMember(userId, workspaceId)
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { giteaToken: true, giteaUsername: true },
    })
    if (!user?.giteaToken || !user?.giteaUsername) return []
    return GiteaClient.listRepos(user.giteaUsername, user.giteaToken)
  },

  async createRepo(userId: string, input: CreateRepoInput) {
    await assertMember(userId, input.workspaceId)
    const token = await getGiteaToken(userId)
    return GiteaClient.createRepo({
      name:        input.name,
      description: input.description,
      private:     input.isPrivate,
      auto_init:   true,
    }, token)
  },

  async deleteRepo(userId: string, owner: string, repo: string) {
    const token = await getGiteaToken(userId)
    await GiteaClient.deleteRepo(owner, repo, token)
    return { deleted: true }
  },

  // ── Branches ──────────────────────────────────────────────────────────────
  async listBranches(userId: string, owner: string, repo: string) {
    const token = await getGiteaToken(userId)
    return GiteaClient.listBranches(owner, repo, token)
  },

  // ── Commits ───────────────────────────────────────────────────────────────
  async listCommits(userId: string, owner: string, repo: string, branch = 'main') {
    const token = await getGiteaToken(userId)
    return GiteaClient.listCommits(owner, repo, branch, token)
  },

  // ── Issues ────────────────────────────────────────────────────────────────
  async listIssues(userId: string, owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') {
    const token = await getGiteaToken(userId)
    return GiteaClient.listIssues(owner, repo, token, state)
  },

  async createIssue(userId: string, owner: string, repo: string, input: CreateIssueInput) {
    const token = await getGiteaToken(userId)
    const user  = await prisma.user.findUnique({ where: { id: userId }, select: { giteaUsername: true } })
    return GiteaClient.createIssue(owner, repo, {
      title:     input.title,
      body:      input.body,
      assignees: user?.giteaUsername ? [user.giteaUsername] : [],
    }, token)
  },

  async closeIssue(userId: string, owner: string, repo: string, index: number) {
    const token = await getGiteaToken(userId)
    return GiteaClient.closeIssue(owner, repo, index, token)
  },

  // ── Pull Requests ─────────────────────────────────────────────────────────
  async listPullRequests(userId: string, owner: string, repo: string) {
    const token = await getGiteaToken(userId)
    return GiteaClient.listPullRequests(owner, repo, token)
  },

  async createPullRequest(userId: string, owner: string, repo: string, input: CreatePRInput) {
    const token = await getGiteaToken(userId)
    return GiteaClient.createPullRequest(owner, repo, input, token)
  },
}
