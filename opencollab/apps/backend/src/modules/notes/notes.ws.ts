import type { FastifyInstance } from 'fastify'
import { WebSocketServer } from 'ws'
import * as Y from 'yjs'
import { verifyAccessToken } from '../../lib/jwt.js'
import { prisma } from '../../lib/prisma.js'

// Map noteId → Y.Doc (documents en mémoire)
const docs = new Map<string, Y.Doc>()

// Map noteId → Set<WebSocket> (clients connectés par note)
const rooms = new Map<string, Set<any>>()

function getDoc(noteId: string): Y.Doc {
  if (!docs.has(noteId)) {
    docs.set(noteId, new Y.Doc())
  }
  return docs.get(noteId)!
}

function getRoom(noteId: string): Set<any> {
  if (!rooms.has(noteId)) {
    rooms.set(noteId, new Set())
  }
  return rooms.get(noteId)!
}

// Persiste le contenu Y.js en base toutes les 10s si modifié
async function persistDoc(noteId: string, doc: Y.Doc) {
  try {
    const content = doc.getMap('content').toJSON()
    await prisma.note.update({
      where: { id: noteId },
      data:  { content },
    })
  } catch {
    // Note supprimée entre temps — silencieux
  }
}

export async function registerNotesWs(app: FastifyInstance) {
  // On monte un WSS raw sur /api/notes/ws/:noteId
  const wss = new WebSocketServer({ noServer: true })

  app.server.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url ?? '', `http://localhost`)
    const match = url.pathname.match(/^\/api\/notes\/ws\/(.+)$/)
    if (!match) return

    const noteId = match[1]

    // Auth via query param token (WS ne supporte pas les headers custom)
    const token = url.searchParams.get('token')
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    let userId: string
    try {
      const payload = verifyAccessToken(token)
      userId = payload.userId
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    // Vérifier accès à la note
    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note) {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
      socket.destroy()
      return
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: note.workspaceId } },
    })
    if (!member && !note.isPublic) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
      socket.destroy()
      return
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, { noteId, userId })
    })
  })

  wss.on('connection', (ws: any, _req: any, ctx: { noteId: string; userId: string }) => {
    const { noteId, userId } = ctx
    const doc  = getDoc(noteId)
    const room = getRoom(noteId)
    room.add(ws)

    let persistTimer: ReturnType<typeof setTimeout> | null = null

    // Envoyer l'état courant du document au nouvel arrivant
    const state = Y.encodeStateAsUpdate(doc)
    ws.send(JSON.stringify({ type: 'sync', state: Array.from(state) }))

    // Annoncer la présence aux autres
    broadcast(room, ws, JSON.stringify({ type: 'presence', userId, online: true }))

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString())

        if (msg.type === 'update') {
          // Appliquer la mise à jour Y.js
          const update = new Uint8Array(msg.update)
          Y.applyUpdate(doc, update)

          // Broadcaster aux autres clients de la même note
          broadcast(room, ws, JSON.stringify({ type: 'update', update: msg.update }))

          // Debounce la persistance (10s après dernière modif)
          if (persistTimer) clearTimeout(persistTimer)
          persistTimer = setTimeout(() => persistDoc(noteId, doc), 10_000)
        }

        if (msg.type === 'cursor') {
          // Curseur de l'utilisateur — broadcaster aux autres
          broadcast(room, ws, JSON.stringify({
            type: 'cursor', userId, position: msg.position,
          }))
        }

      } catch {
        // Message malformé — ignorer
      }
    })

    ws.on('close', () => {
      room.delete(ws)
      if (persistTimer) clearTimeout(persistTimer)
      // Persister immédiatement à la déconnexion
      persistDoc(noteId, doc)
      // Annoncer la déconnexion
      broadcast(room, ws, JSON.stringify({ type: 'presence', userId, online: false }))
      // Nettoyer si plus personne dans la room
      if (room.size === 0) {
        rooms.delete(noteId)
        docs.delete(noteId)
      }
    })
  })

  app.log.info('✅ WebSocket Y.js enregistré sur /api/notes/ws/:noteId')
}

function broadcast(room: Set<any>, sender: any, message: string) {
  room.forEach((client) => {
    if (client !== sender && client.readyState === 1) {
      client.send(message)
    }
  })
}
