import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate.js'
import { GitService } from './git.service.js'
import {
  CreateRepoSchema, RepoParamsSchema,
  CreateIssueSchema, CreatePRSchema, IssueParamsSchema,
} from './git.schema.js'
import { z } from 'zod'

export async function gitRoutes(app: FastifyInstance) {

  // ── Liaison compte Gitea ─────────────────────────────────────────────────
  app.post('/link', { preHandler: authenticate }, async (req, reply) => {
    const r = z.object({ giteaUsername: z.string(), giteaPassword: z.string() }).safeParse(req.body)
    if (!r.success) return reply.status(400).send({ error: 'Paramètres invalides', code: 'VALIDATION_ERROR' })
    try {
      const result = await GitService.linkGiteaAccount(req.userId, r.data.giteaUsername, r.data.giteaPassword)
      return reply.send({ data: result })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  // ── Repos ─────────────────────────────────────────────────────────────────
  app.get('/repos', { preHandler: authenticate }, async (req, reply) => {
    const { workspaceId } = req.query as { workspaceId?: string }
    if (!workspaceId) return reply.status(400).send({ error: 'workspaceId requis', code: 'VALIDATION_ERROR' })
    try {
      return reply.send({ data: await GitService.listRepos(req.userId, workspaceId) })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  app.post('/repos', { preHandler: authenticate }, async (req, reply) => {
    const r = CreateRepoSchema.safeParse(req.body)
    if (!r.success) return reply.status(400).send({ error: 'Validation échouée', code: 'VALIDATION_ERROR', details: r.error.flatten().fieldErrors })
    try {
      return reply.status(201).send({ data: await GitService.createRepo(req.userId, r.data) })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  app.delete('/repos/:owner/:repo', { preHandler: authenticate }, async (req, reply) => {
    const p = RepoParamsSchema.safeParse(req.params)
    if (!p.success) return reply.status(400).send({ error: 'Paramètres invalides', code: 'VALIDATION_ERROR' })
    try {
      return reply.send({ data: await GitService.deleteRepo(req.userId, p.data.owner, p.data.repo) })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  // ── Branches ──────────────────────────────────────────────────────────────
  app.get('/repos/:owner/:repo/branches', { preHandler: authenticate }, async (req, reply) => {
    const p = RepoParamsSchema.safeParse(req.params)
    if (!p.success) return reply.status(400).send({ error: 'Paramètres invalides', code: 'VALIDATION_ERROR' })
    try {
      return reply.send({ data: await GitService.listBranches(req.userId, p.data.owner, p.data.repo) })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  // ── Commits ───────────────────────────────────────────────────────────────
  app.get('/repos/:owner/:repo/commits', { preHandler: authenticate }, async (req, reply) => {
    const p = RepoParamsSchema.safeParse(req.params)
    const { branch = 'main' } = req.query as { branch?: string }
    if (!p.success) return reply.status(400).send({ error: 'Paramètres invalides', code: 'VALIDATION_ERROR' })
    try {
      return reply.send({ data: await GitService.listCommits(req.userId, p.data.owner, p.data.repo, branch) })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  // ── Issues ────────────────────────────────────────────────────────────────
  app.get('/repos/:owner/:repo/issues', { preHandler: authenticate }, async (req, reply) => {
    const p = RepoParamsSchema.safeParse(req.params)
    const { state = 'open' } = req.query as { state?: 'open' | 'closed' | 'all' }
    if (!p.success) return reply.status(400).send({ error: 'Paramètres invalides', code: 'VALIDATION_ERROR' })
    try {
      return reply.send({ data: await GitService.listIssues(req.userId, p.data.owner, p.data.repo, state) })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  app.post('/repos/:owner/:repo/issues', { preHandler: authenticate }, async (req, reply) => {
    const p = RepoParamsSchema.safeParse(req.params)
    const b = CreateIssueSchema.safeParse(req.body)
    if (!p.success || !b.success) return reply.status(400).send({ error: 'Paramètres invalides', code: 'VALIDATION_ERROR' })
    try {
      return reply.status(201).send({ data: await GitService.createIssue(req.userId, p.data.owner, p.data.repo, b.data) })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  app.patch('/repos/:owner/:repo/issues/:index/close', { preHandler: authenticate }, async (req, reply) => {
    const p = IssueParamsSchema.safeParse(req.params)
    if (!p.success) return reply.status(400).send({ error: 'Paramètres invalides', code: 'VALIDATION_ERROR' })
    try {
      return reply.send({ data: await GitService.closeIssue(req.userId, p.data.owner, p.data.repo, p.data.index) })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  // ── Pull Requests ─────────────────────────────────────────────────────────
  app.get('/repos/:owner/:repo/pulls', { preHandler: authenticate }, async (req, reply) => {
    const p = RepoParamsSchema.safeParse(req.params)
    if (!p.success) return reply.status(400).send({ error: 'Paramètres invalides', code: 'VALIDATION_ERROR' })
    try {
      return reply.send({ data: await GitService.listPullRequests(req.userId, p.data.owner, p.data.repo) })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })

  app.post('/repos/:owner/:repo/pulls', { preHandler: authenticate }, async (req, reply) => {
    const p = RepoParamsSchema.safeParse(req.params)
    const b = CreatePRSchema.safeParse(req.body)
    if (!p.success || !b.success) return reply.status(400).send({ error: 'Paramètres invalides', code: 'VALIDATION_ERROR' })
    try {
      return reply.status(201).send({ data: await GitService.createPullRequest(req.userId, p.data.owner, p.data.repo, b.data) })
    } catch (e: any) { return reply.status(e.status ?? 500).send({ error: e.message, code: e.code }) }
  })
}
