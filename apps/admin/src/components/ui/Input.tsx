import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

const baseInputClasses = `
  w-full px-3 py-2 rounded-lg border bg-white text-gray-900
  placeholder:text-gray-400
  focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none
  disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
  dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100
  dark:placeholder:text-gray-500
  dark:focus:ring-accent-soft dark:focus:border-accent-soft
  dark:disabled:bg-slate-900 dark:disabled:text-gray-500
  transition-colors duration-150
`

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, id, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            ${baseInputClasses}
            ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300'}
            ${className}
          `.trim()}
          {...props}
        />
        {hint && !error && (
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{hint}</p>
        )}
        {error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
