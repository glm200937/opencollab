import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DropZone } from '../components/files/DropZone'
import { FileList } from '../components/files/FileList'
import { uploadFiles, listFiles } from '../lib/files.api'
import { useAuthStore } from '../store/auth.store'
import type { UploadedFile } from '../lib/files.api'

// En V0.4 ce workspaceId viendra du contexte/router
const DEMO_WORKSPACE_ID = 'demo-workspace'

export default function FilesPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  const [uploading,  setUploading]  = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // Charger la liste des fichiers
  const { data, isLoading } = useQuery({
    queryKey: ['files', DEMO_WORKSPACE_ID, page],
    queryFn:  () => listFiles(DEMO_WORKSPACE_ID, page),
  })

  const handleFiles = async (files: File[]) => {
    setUploading(true)
    setProgress(0)
    setUploadError(null)

    try {
      await uploadFiles(DEMO_WORKSPACE_ID, files, setProgress)
      await queryClient.invalidateQueries({ queryKey: ['files', DEMO_WORKSPACE_ID] })
    } catch (err: any) {
      setUploadError(err?.response?.data?.error ?? 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDeleted = (fileId: string) => {
    queryClient.setQueryData(
      ['files', DEMO_WORKSPACE_ID, page],
      (old: any) => old
        ? { ...old, data: old.data.filter((f: UploadedFile) => f.id !== fileId) }
        : old,
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Fichiers</h1>
        <p className="mt-1 text-sm text-gray-400">
          {data?.total ?? 0} fichier{(data?.total ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Drop zone */}
      <div className="mb-6">
        <DropZone
          onFiles={handleFiles}
          uploading={uploading}
          progress={progress}
          disabled={uploading}
        />
        {uploadError && (
          <p className="mt-2 text-sm text-red-400">{uploadError}</p>
        )}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-brand-500" />
        </div>
      ) : (
        <>
          <FileList
            files={data?.data ?? []}
            onDeleted={handleDeleted}
            currentUserId={user?.id}
          />

          {/* Pagination */}
          {(data?.totalPages ?? 1) > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-30"
              >
                ← Précédent
              </button>
              <span className="text-sm text-gray-500">
                Page {page} / {data?.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(data?.totalPages ?? 1, p + 1))}
                disabled={page === data?.totalPages}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-30"
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
