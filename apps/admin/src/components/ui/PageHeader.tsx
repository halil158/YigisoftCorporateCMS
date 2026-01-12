import { ReactNode } from 'react'

interface PageHeaderProps {
  description?: string
  actions?: ReactNode
  className?: string
}

/**
 * Consistent page header with optional description and actions
 * Note: The main title is handled by AdminLayout topbar
 */
export function PageHeader({
  description,
  actions,
  className = '',
}: PageHeaderProps) {
  if (!description && !actions) return null

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}
      {!description && <div />}
      {actions && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
