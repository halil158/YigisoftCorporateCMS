import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, id, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            w-full px-3 py-2 rounded-lg border bg-white text-gray-900
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none
            dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100
            dark:focus:ring-accent-soft dark:focus:border-accent-soft
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `.trim()}
          {...props}
        />
        {hint && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{hint}</p>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
