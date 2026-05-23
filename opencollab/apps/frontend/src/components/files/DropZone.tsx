import { useCallback, useState } from 'react'
import { clsx } from 'clsx'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  uploading?: boolean
  progress?:  number
  disabled?:  boolean
}

export function DropZone({ onFiles, uploading, progress, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFiles(files)
  }, [onFiles, disabled])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) onFiles(files)
    e.target.value = ''
  }

  return (
    <label
      className={clsx(
        'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed',
        'cursor-pointer p-10 transition-all duration-200 select-none',
        isDragging
          ? 'border-brand-500 bg-brand-500/10'
          : 'border-gray-700 bg-gray-900 hover:border-gray-500 hover:bg-gray-800/50',
        (disabled || uploading) && 'cursor-not-allowed opacity-50',
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        className="sr-only"
        onChange={handleChange}
        disabled={disabled || uploading}
      />

      {uploading ? (
        <>
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-600 border-t-brand-500" />
          <div className="text-center">
            <p className="text-sm font-medium text-white">Upload en cours…</p>
            <p className="text-xs text-gray-400">{progress ?? 0}%</p>
          </div>
          {/* Barre de progression */}
          <div className="w-full max-w-xs rounded-full bg-gray-700 h-1.5">
            <div
              className="h-1.5 rounded-full bg-brand-500 transition-all duration-300"
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white">
              Glissez vos fichiers ici
              <span className="text-gray-400"> ou cliquez pour parcourir</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">Max 100 MB par fichier</p>
          </div>
        </>
      )}
    </label>
  )
}
