import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:   string
  error?:   string
  hint?:    string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-300">
          {label}
          {props.required && <span className="ml-1 text-red-400">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={clsx(
          'w-full rounded-lg border bg-gray-900 px-4 py-2.5 text-sm text-gray-100',
          'placeholder:text-gray-500 outline-none transition-all duration-150',
          error
            ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
            : 'border-gray-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  ),
)
Input.displayName = 'Input'
