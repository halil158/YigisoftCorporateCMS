import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

export interface RowAction {
  label: string
  onClick?: () => void
  to?: string
  destructive?: boolean
  disabled?: boolean
}

interface RowActionsMenuProps {
  actions: RowAction[]
}

export function RowActionsMenu({ actions }: RowActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on ESC
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleActionClick = (action: RowAction) => {
    if (action.disabled) return
    if (action.onClick) {
      action.onClick()
    }
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block text-left">
      {/* 3-dots button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
                   dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-700
                   transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-accent-soft"
        aria-label="Actions"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 z-10 mt-1 w-40 origin-top-right rounded-lg bg-white shadow-lg
                     ring-1 ring-black ring-opacity-5 dark:bg-slate-800 dark:ring-slate-700"
        >
          <div className="py-1">
            {actions.map((action, index) => {
              const baseClasses = `
                block w-full text-left px-4 py-2 text-sm transition-colors
                ${action.disabled
                  ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : action.destructive
                    ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700'
                }
              `.trim()

              if (action.to && !action.disabled) {
                return (
                  <Link
                    key={index}
                    to={action.to}
                    className={baseClasses}
                    onClick={() => setIsOpen(false)}
                  >
                    {action.label}
                  </Link>
                )
              }

              return (
                <button
                  key={index}
                  type="button"
                  className={baseClasses}
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                >
                  {action.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
