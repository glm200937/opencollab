import { useState } from 'react'
import { formatFileSize, getFileIcon, getDownloadUrl, deleteFile } from '../../lib/files.api'
import type { UploadedFile } from '../../lib/files.api'

interface FileListProps {
  files:     UploadedFile[]
  onDeleted: (fileId: string) => void
  currentUserId?: string
}

export function FileList({ files, onDeleted, currentUserId }: FileListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-500">
        <span className="text-4xl">📂</span>
        <p className="text-sm">Aucun fichier pour l'instant</p>
      </div>
    )
  }

  const handleDownload = async (file: UploadedFile) => {
    setLoadingId(file.id)
    try {
      const url = await getDownloadUrl(file.id)
      const a   = document.createElement('a')
      a.href    = url
      a.download = file.name
      a.click()
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (file: UploadedFile) => {
    if (!confirm(`Supprimer "${file.name}" ?`)) return
    setLoadingId(file.id)
    try {
      await deleteFile(file.id)
      onDeleted(file.id)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="divide-y divide-gray-800 rounded-xl border border-gray-800 bg-gray-900">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-gray-800/50"
        >
          {/* Icône */}
          <span className="text-2xl flex-shrink-0">{getFileIcon(file.mimeType)}</span>

          {/* Infos */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-100">{file.name}</p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)} · {file.uploader.displayName} ·{' '}
              {new Date(file.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => handleDownload(file)}
              disabled={loadingId === file.id}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white disabled:opacity-50"
              title="Télécharger"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            {(file.uploadedBy === currentUserId) && (
              <button
                onClick={() => handleDelete(file)}
                disabled={loadingId === file.id}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
                title="Supprimer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
