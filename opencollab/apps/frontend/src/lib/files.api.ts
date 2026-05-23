import { api } from './api'
import type { FileAsset, PaginatedResponse } from '@opencollab/types'

export interface UploadedFile extends FileAsset {
  uploader: { id: string; displayName: string; avatarUrl?: string }
}

// Upload un ou plusieurs fichiers
export async function uploadFiles(
  workspaceId: string,
  files: File[],
  onProgress?: (percent: number) => void,
): Promise<UploadedFile[]> {
  const formData = new FormData()
  files.forEach((f) => formData.append('files', f))

  const { data } = await api.post<{ data: UploadedFile[] }>(
    `/files/upload?workspaceId=${workspaceId}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      },
    },
  )
  return data.data
}

// Lister les fichiers d'un workspace
export async function listFiles(
  workspaceId: string,
  page = 1,
  perPage = 20,
): Promise<PaginatedResponse<UploadedFile>> {
  const { data } = await api.get<PaginatedResponse<UploadedFile>>(
    `/files?workspaceId=${workspaceId}&page=${page}&perPage=${perPage}`,
  )
  return data
}

// Obtenir l'URL de téléchargement
export async function getDownloadUrl(fileId: string): Promise<string> {
  const { data } = await api.get<{ data: { url: string } }>(`/files/${fileId}/download`)
  return data.data.url
}

// Supprimer un fichier
export async function deleteFile(fileId: string): Promise<void> {
  await api.delete(`/files/${fileId}`)
}

// Utilitaires
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/'))       return '🖼️'
  if (mimeType.startsWith('video/'))       return '🎬'
  if (mimeType.startsWith('audio/'))       return '🎵'
  if (mimeType === 'application/pdf')      return '📄'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊'
  if (mimeType.includes('word'))           return '📝'
  if (mimeType.includes('zip') || mimeType.includes('tar')) return '📦'
  if (mimeType.startsWith('text/'))        return '📃'
  return '📁'
}
