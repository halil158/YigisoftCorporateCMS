import { ReactNode } from 'react'
import { SectionType, SECTION_TYPES } from './types'
import { Badge } from '../ui'

interface SectionCardProps {
  type: SectionType
  index: number
  totalCount: number
  isExpanded?: boolean
  onToggle?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDelete?: () => void
  children: ReactNode
}

export function SectionCard({
  type,
  index,
  totalCount,
  isExpanded = true,
  onToggle,
  onMoveUp,
  onMoveDown,
  onDelete,
  children,
}: SectionCardProps) {
  const meta = SECTION_TYPES.find((t) => t.type === type)
  const label = meta?.label || type
  const canMoveUp = index > 0
  const canMoveDown = index < totalCount - 1

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-700/50 cursor-pointer select-none"
        onClick={onToggle}
      >
        {/* Expand/Collapse indicator */}
        <svg
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        {/* Section type badge */}
        <Badge variant="info" size="sm">
          {label}
        </Badge>

        {/* Section number */}
        <span className="text-sm text-gray-500 dark:text-gray-400">
          #{index + 1}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Move Up */}
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {/* Move Down */}
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
            title="Delete section"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
          {children}
        </div>
      )}
    </div>
  )
}
