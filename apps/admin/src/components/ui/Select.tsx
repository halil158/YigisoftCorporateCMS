import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, id, className = '', children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={`
            w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none
            dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100
            ${className}
          `.trim()}
          {...props}
        >
          {children}
        </select>
        {hint && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{hint}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
