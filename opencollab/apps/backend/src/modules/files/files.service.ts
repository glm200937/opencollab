import { randomUUID } from 'crypto'
import { Readable } from 'stream'
import { prisma } from '../../lib/prisma.js'
import { minio, BUCKET, getPresignedUrl, deleteObject } from '../../lib/minio.js'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from './files.schema.js'

export const FilesService = {

  async upload(opts: {
    workspaceId: string
    uploadedBy:  string
    filename:    string
    mimeType:    string
    size:        number
    stream:      Readable
  }) {
    // Vérifier type MIME
    if (!ALLOWED_MIME_TYPES.includes(opts.mimeType as any)) {
      throw Object.assign(
        new Error(`Type de fichier non autorisé : ${opts.mimeType}`),
        { code: 'INVALID_MIME_TYPE', status: 400 },
      )
    }

    // Vérifier taille
    if (opts.size > MAX_FILE_SIZE) {
      throw Object.assign(
        new Error('Fichier trop volumineux (max 100 MB)'),
        { code: 'FILE_TOO_LARGE', status: 400 },
      )
    }

    // Vérifier que le workspace existe et que l'utilisateur en est membre
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId:      opts.uploadedBy,
          workspaceId: opts.workspaceId,
        },
      },
    })
    if (!member) {
      throw Object.assign(
        new Error('Accès refusé à ce workspace'),
        { code: 'FORBIDDEN', status: 403 },
      )
    }

    // Construire la clé de stockage : workspaceId/uuid/filename
    const ext        = opts.filename.split('.').pop() ?? ''
    const objectKey  = `${opts.workspaceId}/${randomUUID()}${ext ? '.' + ext : ''}`

    // Upload vers MinIO
    await minio.putObject(BUCKET, objectKey, opts.stream, opts.size, {
      'Content-Type': opts.mimeType,
      'X-Original-Name': encodeURIComponent(opts.filename),
    })

    // Persister en base
    const file = await prisma.fileAsset.create({
      data: {
        name:        opts.filename,
        mimeType:    opts.mimeType,
        size:        opts.size,
        storageKey:  objectKey,
        workspaceId: opts.workspaceId,
        uploadedBy:  opts.uploadedBy,
      },
      include: {
        uploader: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    })

    return file
  },

  async list(opts: { workspaceId: string; userId: string; page: number; perPage: number }) {
    // Vérifier accès workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: opts.userId, workspaceId: opts.workspaceId,
        },
      },
    })
    if (!member) {
      throw Object.assign(new Error('Accès refusé'), { code: 'FORBIDDEN', status: 403 })
    }

    const [files, total] = await Promise.all([
      prisma.fileAsset.findMany({
        where:   { workspaceId: opts.workspaceId },
        include: { uploader: { select: { id: true, displayName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip:    (opts.page - 1) * opts.perPage,
        take:    opts.perPage,
      }),
      prisma.fileAsset.count({ where: { workspaceId: opts.workspaceId } }),
    ])

    return {
      data:       files,
      total,
      page:       opts.page,
      perPage:    opts.perPage,
      totalPages: Math.ceil(total / opts.perPage),
    }
  },

  async getDownloadUrl(opts: { fileId: string; userId: string }) {
    const file = await prisma.fileAsset.findUnique({
      where: { id: opts.fileId },
    })
    if (!file) {
      throw Object.assign(new Error('Fichier introuvable'), { code: 'NOT_FOUND', status: 404 })
    }

    // Vérifier accès workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId: opts.userId, workspaceId: file.workspaceId },
      },
    })
    if (!member) {
      throw Object.assign(new Error('Accès refusé'), { code: 'FORBIDDEN', status: 403 })
    }

    const url = await getPresignedUrl(file.storageKey)
    return { url, file }
  },

  async delete(opts: { fileId: string; userId: string }) {
    const file = await prisma.fileAsset.findUnique({ where: { id: opts.fileId } })
    if (!file) {
      throw Object.assign(new Error('Fichier introuvable'), { code: 'NOT_FOUND', status: 404 })
    }

    // Seul l'uploader ou un admin peut supprimer
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId: opts.userId, workspaceId: file.workspaceId },
      },
    })
    const canDelete = file.uploadedBy === opts.userId ||
      member?.role === 'OWNER' || member?.role === 'ADMIN'

    if (!canDelete) {
      throw Object.assign(new Error('Accès refusé'), { code: 'FORBIDDEN', status: 403 })
    }

    await deleteObject(file.storageKey)
    await prisma.fileAsset.delete({ where: { id: opts.fileId } })
    return { deleted: true }
  },
}
