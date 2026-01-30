import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useNavigation } from '../hooks/useNavigation'
import { useBranding } from '../hooks/useBranding'
import type { NavigationItem } from '../api/client'

interface Props {
  children: ReactNode
}

// External link icon component
function ExternalLinkIcon() {
  return (
    <svg
      className="inline-block w-3 h-3 ml-1 -mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  )
}

// Chevron icons
function ChevronDown() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

// Navigation link for items without children
function NavLink({ item }: { item: NavigationItem }) {
  const isExternal = item.type === 'external'
  const href = item.type === 'page' ? `/${item.slug}` : item.url

  return (
    <a
      href={href}
      target={isExternal && item.newTab ? '_blank' : undefined}
      rel={isExternal && item.newTab ? 'noopener noreferrer' : undefined}
      className="text-gray-600 hover:text-primary-600 transition-colors"
    >
      {item.label}
      {isExternal && item.newTab && <ExternalLinkIcon />}
    </a>
  )
}

// Dropdown link content (used in dropdown menus)
function DropdownLinkContent({ item }: { item: NavigationItem }) {
  const isExternal = item.type === 'external'
  const href = item.type === 'page' ? `/${item.slug}` : item.url

  return (
    <a
      href={href}
      target={isExternal && item.newTab ? '_blank' : undefined}
      rel={isExternal && item.newTab ? 'noopener noreferrer' : undefined}
      className="block px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors"
    >
      {item.label}
      {isExternal && item.newTab && <ExternalLinkIcon />}
    </a>
  )
}

// Level 3 submenu (deepest level)
function Submenu({
  items,
  parentRect,
  isVisible
}: {
  items: NavigationItem[]
  parentRect: DOMRect | null
  isVisible: boolean
}) {
  const [flipToLeft, setFlipToLeft] = useState(false)
  const menuRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!parentRect || !isVisible) return

    const menuWidth = 200 // min-w-48 = 12rem = 192px, use 200 for safety
    const viewportWidth = window.innerWidth
    const rightEdge = parentRect.right + menuWidth
    const leftEdge = parentRect.left - menuWidth

    // Flip to left if opening right would overflow and left has space
    setFlipToLeft(rightEdge > viewportWidth && leftEdge >= 0)
  }, [parentRect, isVisible])

  if (!isVisible) return null

  return (
    <div
      className={`absolute top-0 ${flipToLeft ? 'right-full pr-2' : 'left-full pl-2'} z-50`}
    >
      <ul
        ref={menuRef}
        className="bg-white border border-gray-200 rounded-lg shadow-lg min-w-48 py-1"
      >
        {items.map((item) => (
          <li key={item.id}>
            <DropdownLinkContent item={item} />
          </li>
        ))}
      </ul>
    </div>
  )
}

// Level 2 dropdown item (can have Level 3 children)
function DropdownItem({ item }: { item: NavigationItem }) {
  const [isHovered, setIsHovered] = useState(false)
  const itemRef = useRef<HTMLLIElement>(null)
  const [itemRect, setItemRect] = useState<DOMRect | null>(null)

  const hasChildren = item.children.length > 0

  useEffect(() => {
    if (isHovered && itemRef.current) {
      setItemRect(itemRef.current.getBoundingClientRect())
    }
  }, [isHovered])

  if (!hasChildren) {
    return (
      <li>
        <DropdownLinkContent item={item} />
      </li>
    )
  }

  const renderItemContent = () => {
    if (item.type === 'group') {
      return <span className="flex-1">{item.label}</span>
    }

    const href = item.type === 'page' ? `/${item.slug}` : item.url
    const isExternal = item.type === 'external'

    return (
      <a
        href={href}
        target={isExternal && item.newTab ? '_blank' : undefined}
        rel={isExternal && item.newTab ? 'noopener noreferrer' : undefined}
        className="flex-1"
      >
        {item.label}
      </a>
    )
  }

  return (
    <li
      ref={itemRef}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors cursor-pointer">
        {renderItemContent()}
        <ChevronRight />
      </div>
      <Submenu
        items={item.children}
        parentRect={itemRect}
        isVisible={isHovered}
      />
    </li>
  )
}

// Level 1 dropdown menu (top-level nav items with children)
function DropdownMenu({ item, index, totalItems }: { item: NavigationItem; index: number; totalItems: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [alignRight, setAlignRight] = useState(false)

  const hasChildren = item.children.length > 0

  // Determine if this dropdown should align to the right based on position
  useEffect(() => {
    if (!menuRef.current || !isOpen) return

    const rect = menuRef.current.getBoundingClientRect()
    const menuWidth = 200
    const viewportWidth = window.innerWidth

    // If the dropdown would overflow right, align it to the right
    const wouldOverflowRight = rect.left + menuWidth > viewportWidth
    // Also align right if this is one of the last items
    const isLastItems = index >= totalItems - 2

    setAlignRight(wouldOverflowRight || isLastItems)
  }, [isOpen, index, totalItems])

  if (!hasChildren) {
    return <NavLink item={item} />
  }

  const renderParentContent = () => {
    if (item.type === 'group') {
      return <span className="cursor-default">{item.label}</span>
    }

    const href = item.type === 'page' ? `/${item.slug}` : item.url
    const isExternal = item.type === 'external'

    return (
      <a
        href={href}
        target={isExternal && item.newTab ? '_blank' : undefined}
        rel={isExternal && item.newTab ? 'noopener noreferrer' : undefined}
        className="hover:text-primary-600"
      >
        {item.label}
      </a>
    )
  }

  return (
    <div
      ref={menuRef}
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        className="flex items-center gap-1 text-gray-600 hover:text-primary-600 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {renderParentContent()}
        <span className={`transition-colors ${isOpen ? 'text-primary-600' : 'text-gray-400'}`}>
          <ChevronDown />
        </span>
      </button>

      {/* Dropdown panel */}
      <div
        className={`
          absolute top-full pt-2 z-50
          transition-all duration-150
          ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}
          ${alignRight ? 'right-0' : 'left-0'}
        `}
      >
        <ul className="bg-white border border-gray-200 rounded-lg shadow-lg min-w-48 py-1">
          {item.children.map((child) => (
            <DropdownItem key={child.id} item={child} />
          ))}
        </ul>
      </div>
    </div>
  )
}

// Mobile menu button
function MobileMenuButton({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="sm:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )}
    </button>
  )
}

// Mobile navigation menu
function MobileNav({ items, isOpen, onClose }: { items: NavigationItem[]; isOpen: boolean; onClose: () => void }) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const renderMobileItem = (item: NavigationItem, level: number = 0) => {
    const hasChildren = item.children.length > 0
    const isExpanded = expandedItems.has(item.id)
    const paddingLeft = `${1 + level * 1}rem`

    if (!hasChildren) {
      const href = item.type === 'page' ? `/${item.slug}` : item.url
      const isExternal = item.type === 'external'

      return (
        <a
          key={item.id}
          href={href}
          target={isExternal && item.newTab ? '_blank' : undefined}
          rel={isExternal && item.newTab ? 'noopener noreferrer' : undefined}
          className="block py-3 text-gray-700 hover:text-primary-600 border-b border-gray-100"
          style={{ paddingLeft }}
          onClick={onClose}
        >
          {item.label}
          {isExternal && item.newTab && <ExternalLinkIcon />}
        </a>
      )
    }

    return (
      <div key={item.id}>
        <button
          type="button"
          onClick={() => toggleExpand(item.id)}
          className="w-full flex items-center justify-between py-3 text-gray-700 hover:text-primary-600 border-b border-gray-100"
          style={{ paddingLeft, paddingRight: '1rem' }}
        >
          <span>{item.label}</span>
          <span className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
            <ChevronRight />
          </span>
        </button>
        {isExpanded && (
          <div className="bg-gray-50">
            {item.children.map(child => renderMobileItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="sm:hidden fixed inset-0 top-16 z-40 bg-white overflow-y-auto">
      <nav className="px-4 py-2">
        {items.map(item => renderMobileItem(item))}
      </nav>
    </div>
  )
}

export function Layout({ children }: Props) {
  const { items, isLoading } = useNavigation('main')
  const { branding } = useBranding()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640 && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [mobileMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const logoUrl = branding.logoLightUrl
  const siteName = branding.siteName || 'Yigisoft'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2 flex-shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="h-8 w-auto" />
              ) : (
                <>
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {siteName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xl font-semibold text-gray-900">{siteName}</span>
                </>
              )}
            </a>

            {/* Desktop navigation */}
            <nav className="hidden sm:flex items-center gap-6">
              {isLoading ? (
                <span className="text-gray-400">...</span>
              ) : items.length > 0 ? (
                items.map((item, index) => (
                  <DropdownMenu
                    key={item.id}
                    item={item}
                    index={index}
                    totalItems={items.length}
                  />
                ))
              ) : (
                <a href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Home
                </a>
              )}
            </nav>

            {/* Mobile menu button */}
            <MobileMenuButton
              isOpen={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            />
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <MobileNav
        items={items}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="h-6 w-auto brightness-0 invert" />
              ) : (
                <>
                  <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center text-white text-sm font-bold">
                    {siteName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white font-medium">{siteName}</span>
                </>
              )}
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
