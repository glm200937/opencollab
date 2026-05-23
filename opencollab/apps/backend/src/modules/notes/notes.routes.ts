import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate.js'
import { NotesService } from './notes.service.js'
import {
  CreateNoteSchema,
  UpdateNoteSchema,
  NoteParamsSchema,
  ListNotesQuerySchema,
} from './notes.schema.js'

export async function notesRoutes(app: FastifyInstance) {

  // POST /api/notes — créer une note
  app.post('/', { preHandler: authenticate }, async (request, reply) => {
    const result = CreateNoteSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        error: 'Validation échouée', code: 'VALIDATION_ERROR',
        details: result.error.flatten().fieldErrors,
      })
    }
    try {
      const note = await NotesService.create({ ...result.data, authorId: request.userId })
      return reply.status(201).send({ data: note })
    } catch (err: any) {
      return reply.status(err.status ?? 500).send({ error: err.message, code: err.code ?? 'INTERNAL_ERROR' })
    }
  })

  // GET /api/notes?workspaceId=&parentId= — lister
  app.get('/', { preHandler: authenticate }, async (request, reply) => {
    const result = ListNotesQuerySchema.safeParse(request.query)
    if (!result.success) {
      return reply.status(400).send({ error: 'workspaceId requis', code: 'VALIDATION_ERROR' })
    }
    try {
      const notes = await NotesService.list({ ...result.data, userId: request.userId })
      return reply.send({ data: notes })
    } catch (err: any) {
      return reply.status(err.status ?? 500).send({ error: err.message, code: err.code ?? 'INTERNAL_ERROR' })
    }
  })

  // GET /api/notes/:noteId
  app.get('/:noteId', { preHandler: authenticate }, async (request, reply) => {
    const params = NoteParamsSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send({ error: 'noteId invalide', code: 'VALIDATION_ERROR' })
    try {
      const note = await NotesService.getById(params.data.noteId, request.userId)
      return reply.send({ data: note })
    } catch (err: any) {
      return reply.status(err.status ?? 500).send({ error: err.message, code: err.code ?? 'INTERNAL_ERROR' })
    }
  })

  // PATCH /api/notes/:noteId — mise à jour titre/contenu
  app.patch('/:noteId', { preHandler: authenticate }, async (request, reply) => {
    const params = NoteParamsSchema.safeParse(request.params)
    const body   = UpdateNoteSchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Paramètres invalides', code: 'VALIDATION_ERROR' })
    }
    try {
      const note = await NotesService.update(params.data.noteId, request.userId, body.data)
      return reply.send({ data: note })
    } catch (err: any) {
      return reply.status(err.status ?? 500).send({ error: err.message, code: err.code ?? 'INTERNAL_ERROR' })
    }
  })

  // DELETE /api/notes/:noteId
  app.delete('/:noteId', { preHandler: authenticate }, async (request, reply) => {
    const params = NoteParamsSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send({ error: 'noteId invalide', code: 'VALIDATION_ERROR' })
    try {
      const result = await NotesService.delete(params.data.noteId, request.userId)
      return reply.send({ data: result })
    } catch (err: any) {
      return reply.status(err.status ?? 500).send({ error: err.message, code: err.code ?? 'INTERNAL_ERROR' })
    }
  })
}
