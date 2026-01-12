import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
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

interface MenuPosition {
  top: number
  left: number
  placement: 'bottom' | 'top'
}

const MENU_WIDTH = 160 // w-40 = 10rem = 160px
const MENU_PADDING = 8 // margin from viewport edge

export function RowActionsMenu({ actions }: RowActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0, placement: 'bottom' })
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Calculate menu position based on button location and viewport
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return

    const buttonRect = buttonRef.current.getBoundingClientRect()
    const menuHeight = menuRef.current?.offsetHeight || 150 // estimate if not yet rendered
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    // Check if there's enough space below
    const spaceBelow = viewportHeight - buttonRect.bottom
    const spaceAbove = buttonRect.top
    const placement = spaceBelow >= menuHeight + MENU_PADDING ? 'bottom' :
                      spaceAbove >= menuHeight + MENU_PADDING ? 'top' : 'bottom'

    // Calculate top position
    let top: number
    if (placement === 'bottom') {
      top = buttonRect.bottom + 4 // 4px gap
    } else {
      top = buttonRect.top - menuHeight - 4
    }

    // Calculate left position (align right edge of menu with right edge of button)
    let left = buttonRect.right - MENU_WIDTH

    // If menu would go off left edge, shift it right
    if (left < MENU_PADDING) {
      left = MENU_PADDING
    }

    // If menu would go off right edge, shift it left
    if (left + MENU_WIDTH > viewportWidth - MENU_PADDING) {
      left = viewportWidth - MENU_WIDTH - MENU_PADDING
    }

    setPosition({ top, left, placement })
  }, [])

  // Update position when menu opens
  useEffect(() => {
    if (isOpen) {
      updatePosition()
    }
  }, [isOpen, updatePosition])

  // Update position after menu renders (to get actual height)
  useEffect(() => {
    if (isOpen && menuRef.current) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(updatePosition)
    }
  }, [isOpen, updatePosition])

  // Close on scroll (simpler than tracking position during scroll)
  useEffect(() => {
    if (!isOpen) return

    const handleScroll = () => {
      setIsOpen(false)
    }

    // Use capture to catch scroll events on all elements
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [isOpen])

  // Close on resize
  useEffect(() => {
    if (!isOpen) return

    const handleResize = () => {
      setIsOpen(false)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

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

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleActionClick = (action: RowAction) => {
    if (action.disabled) return
    if (action.onClick) {
      action.onClick()
    }
    setIsOpen(false)
  }

  const dropdown = isOpen ? (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: MENU_WIDTH,
      }}
      className="z-50 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5
                 dark:bg-slate-800 dark:ring-slate-700"
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
  ) : null

  return (
    <>
      {/* 3-dots button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
                   dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-700
                   transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-accent-soft"
        aria-label="Actions"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {/* Portal dropdown to document.body */}
      {dropdown && createPortal(dropdown, document.body)}
    </>
  )
}
