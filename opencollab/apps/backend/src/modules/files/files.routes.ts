import type { FastifyInstance } from 'fastify'
import multipart from '@fastify/multipart'
import { authenticate } from '../../middleware/authenticate.js'
import { FilesService } from './files.service.js'
import {
  UploadQuerySchema,
  FileParamsSchema,
  ListFilesQuerySchema,
  MAX_FILE_SIZE,
} from './files.schema.js'

export async function filesRoutes(app: FastifyInstance) {

  // Enregistrer le plugin multipart pour ce scope
  await app.register(multipart, {
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: 10, // max 10 fichiers par requête
    },
  })

  // ── POST /api/files/upload ─────────────────────────────────────────────────
  app.post('/upload', { preHandler: authenticate }, async (request, reply) => {
    const query = UploadQuerySchema.safeParse(request.query)
    if (!query.success) {
      return reply.status(400).send({
        error: 'workspaceId requis',
        code: 'VALIDATION_ERROR',
        details: query.error.flatten().fieldErrors,
      })
    }

    const results = []
    const parts = request.files()

    for await (const part of parts) {
      try {
        const file = await FilesService.upload({
          workspaceId: query.data.workspaceId,
          uploadedBy:  request.userId,
          filename:    part.filename,
          mimeType:    part.mimetype,
          size:        part.file.readableLength ?? 0,
          stream:      part.file,
        })
        results.push(file)
      } catch (err: any) {
        return reply.status(err.status ?? 500).send({
          error: err.message,
          code:  err.code ?? 'UPLOAD_ERROR',
        })
      }
    }

    return reply.status(201).send({ data: results })
  })

  // ── GET /api/files?workspaceId=xxx ─────────────────────────────────────────
  app.get('/', { preHandler: authenticate }, async (request, reply) => {
    const query = ListFilesQuerySchema.safeParse(request.query)
    if (!query.success) {
      return reply.status(400).send({
        error: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: query.error.flatten().fieldErrors,
      })
    }

    try {
      const result = await FilesService.list({
        workspaceId: query.data.workspaceId,
        userId:      request.userId,
        page:        query.data.page,
        perPage:     query.data.perPage,
      })
      return reply.send(result)
    } catch (err: any) {
      return reply.status(err.status ?? 500).send({
        error: err.message, code: err.code ?? 'INTERNAL_ERROR',
      })
    }
  })

  // ── GET /api/files/:fileId/download ────────────────────────────────────────
  app.get('/:fileId/download', { preHandler: authenticate }, async (request, reply) => {
    const params = FileParamsSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'fileId invalide', code: 'VALIDATION_ERROR' })
    }

    try {
      const { url, file } = await FilesService.getDownloadUrl({
        fileId: params.data.fileId,
        userId: request.userId,
      })
      return reply.send({ data: { url, file } })
    } catch (err: any) {
      return reply.status(err.status ?? 500).send({
        error: err.message, code: err.code ?? 'INTERNAL_ERROR',
      })
    }
  })

  // ── DELETE /api/files/:fileId ──────────────────────────────────────────────
  app.delete('/:fileId', { preHandler: authenticate }, async (request, reply) => {
    const params = FileParamsSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'fileId invalide', code: 'VALIDATION_ERROR' })
    }

    try {
      const result = await FilesService.delete({
        fileId: params.data.fileId,
        userId: request.userId,
      })
      return reply.send({ data: result })
    } catch (err: any) {
      return reply.status(err.status ?? 500).send({
        error: err.message, code: err.code ?? 'INTERNAL_ERROR',
      })
    }
  })
}
