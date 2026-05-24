import { useState, useRef, useCallback } from 'react'
import { clsx } from 'clsx'

interface MessageInputProps {
  onSend:       (content: string) => void
  onTyping:     () => void
  onStopTyping: () => void
  disabled?:    boolean
  editingContent?: string
  onCancelEdit?: () => void
}

export function MessageInput({
  onSend, onTyping, onStopTyping, disabled, editingContent, onCancelEdit,
}: MessageInputProps) {
  const [content,   setContent]   = useState(editingContent ?? '')
  const [isTyping,  setIsTyping]  = useState(false)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)

    // Gestion indicateur frappe
    if (!isTyping) {
      setIsTyping(true)
      onTyping()
    }
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      setIsTyping(false)
      onStopTyping()
    }, 2000)

    // Auto-resize
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 150)}px`
    }
  }

  const handleSend = useCallback(() => {
    const trimmed = content.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setContent('')
    if (typingTimer.current) clearTimeout(typingTimer.current)
    setIsTyping(false)
    onStopTyping()
    // Reset hauteur textarea
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [content, disabled, onSend, onStopTyping])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape' && onCancelEdit) onCancelEdit()
  }

  return (
    <div className={clsx(
      'border-t border-gray-800 px-4 py-3',
      editingContent !== undefined && 'bg-yellow-500/5 border-t-yellow-500/30',
    )}>
      {/* Bandeau édition */}
      {editingContent !== undefined && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-yellow-400">✏️ Mode édition</span>
          <button onClick={onCancelEdit} className="text-xs text-gray-500 hover:text-gray-300">
            Annuler (Echap)
          </button>
        </div>
      )}

      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Envoyer un message… (Entrée pour envoyer, Shift+Entrée pour sauter une ligne)"
          rows={1}
          className={clsx(
            'flex-1 resize-none rounded-xl border bg-gray-800 px-4 py-2.5 text-sm text-gray-100',
            'placeholder:text-gray-600 outline-none transition-all duration-150 max-h-[150px]',
            'border-gray-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className={clsx(
            'flex-shrink-0 rounded-xl p-2.5 transition-all duration-150',
            content.trim() && !disabled
              ? 'bg-brand-600 text-white hover:bg-brand-500'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed',
          )}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}
