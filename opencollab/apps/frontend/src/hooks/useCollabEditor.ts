import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { useAuthStore } from '../store/auth.store'

interface UseCollabEditorOptions {
  noteId:   string
  readonly?: boolean
}

interface Collaborator {
  userId:      string
  online:      boolean
  cursorColor: string
}

// Couleurs pour les curseurs des collaborateurs
const CURSOR_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16',
]

function pickColor(userId: string): string {
  let hash = 0
  for (const c of userId) hash = (hash * 31 + c.charCodeAt(0)) | 0
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}

export function useCollabEditor({ noteId, readonly = false }: UseCollabEditorOptions) {
  const accessToken   = useAuthStore(s => s.accessToken)
  const currentUser   = useAuthStore(s => s.user)

  const docRef        = useRef<Y.Doc>(new Y.Doc())
  const wsRef         = useRef<WebSocket | null>(null)
  const [connected,   setConnected]   = useState(false)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [wsError,     setWsError]     = useState<string | null>(null)

  // ── Éditeur TipTap ───────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({ document: docRef.current }),
      CollaborationCursor.configure({
        provider: null as any, // on gère le WS manuellement
        user: {
          name:  currentUser?.displayName ?? 'Anonyme',
          color: currentUser ? pickColor(currentUser.id) : '#3b82f6',
        },
      }),
    ],
    editable: !readonly,
  })

  // ── Connexion WebSocket ───────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !noteId) return

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/notes/ws/${noteId}?token=${accessToken}`
    const ws    = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setWsError(null)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)

        if (msg.type === 'sync') {
          // État initial du document
          const update = new Uint8Array(msg.state)
          Y.applyUpdate(docRef.current, update)
        }

        if (msg.type === 'update') {
          // Mise à jour d'un autre client
          const update = new Uint8Array(msg.update)
          Y.applyUpdate(docRef.current, update)
        }

        if (msg.type === 'presence') {
          setCollaborators(prev => {
            const filtered = prev.filter(c => c.userId !== msg.userId)
            if (msg.online) {
              return [...filtered, {
                userId:      msg.userId,
                online:      true,
                cursorColor: pickColor(msg.userId),
              }]
            }
            return filtered
          })
        }
      } catch {
        // Message malformé
      }
    }

    ws.onerror = () => {
      setWsError('Connexion temps réel perdue')
      setConnected(false)
    }

    ws.onclose = () => {
      setConnected(false)
    }

    // Envoyer les updates locaux Y.js au serveur
    const unobserve = docRef.current.on('update', (update: Uint8Array) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'update', update: Array.from(update) }))
      }
    })

    return () => {
      ws.close()
      docRef.current.off('update', unobserve as any)
      setConnected(false)
    }
  }, [noteId, accessToken])

  return { editor, connected, collaborators, wsError }
}
