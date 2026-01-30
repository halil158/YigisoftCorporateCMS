import type { ReactNode } from 'react'
import { useNavigation } from '../hooks/useNavigation'
import type { NavigationItem } from '../api/client'

interface Props {
  children: ReactNode
}

function NavLinkContent({ item }: { item: NavigationItem }) {
  const href = item.type === 'page' ? `/${item.slug}` : item.url
  const isExternal = item.type === 'external'

  return (
    <a
      href={href}
      target={isExternal && item.newTab ? '_blank' : undefined}
      rel={isExternal && item.newTab ? 'noopener noreferrer' : undefined}
      className="block px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors"
    >
      {item.label}
      {isExternal && item.newTab && (
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
      )}
    </a>
  )
}

function NavLink({ item }: { item: NavigationItem }) {
  if (item.type === 'page') {
    return (
      <a
        href={`/${item.slug}`}
        className="text-gray-600 hover:text-primary-600 transition-colors"
      >
        {item.label}
      </a>
    )
  }

  // External link
  return (
    <a
      href={item.url}
      target={item.newTab ? '_blank' : undefined}
      rel={item.newTab ? 'noopener noreferrer' : undefined}
      className="text-gray-600 hover:text-primary-600 transition-colors"
    >
      {item.label}
      {item.newTab && (
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
      )}
    </a>
  )
}

function DropdownMenu({ item }: { item: NavigationItem }) {
  const hasChildren = item.children.length > 0

  if (!hasChildren) {
    return <NavLink item={item} />
  }

  // For group type: render as non-navigating button
  // For page/external with children: render the link + dropdown
  const renderParentContent = () => {
    if (item.type === 'group') {
      // Group: non-clickable, just opens dropdown on hover
      return (
        <span className="cursor-default">{item.label}</span>
      )
    }
    if (item.type === 'page') {
      return (
        <a href={`/${item.slug}`} className="hover:text-primary-600">
          {item.label}
        </a>
      )
    }
    // external
    return (
      <a
        href={item.url}
        target={item.newTab ? '_blank' : undefined}
        rel={item.newTab ? 'noopener noreferrer' : undefined}
        className="hover:text-primary-600"
      >
        {item.label}
      </a>
    )
  }

  return (
    <div className="relative group">
      {/* Parent item - group is non-navigating, page/external can be clicked */}
      <button
        type="button"
        className="flex items-center gap-1 text-gray-600 hover:text-primary-600 transition-colors"
        aria-haspopup="true"
      >
        {renderParentContent()}
        <svg
          className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Level 2 dropdown */}
      <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
        <ul className="bg-white border border-gray-200 rounded-lg shadow-lg min-w-48 py-1">
          {item.children.map((child) => (
            <li key={child.id} className="relative group/sub">
              {child.children.length > 0 ? (
                <>
                  {/* Level 2 item with level 3 children */}
                  <div className="flex items-center justify-between px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors cursor-pointer">
                    {child.type === 'group' ? (
                      <span className="flex-1">{child.label}</span>
                    ) : child.type === 'page' ? (
                      <a href={`/${child.slug}`} className="flex-1">
                        {child.label}
                      </a>
                    ) : (
                      <a
                        href={child.url}
                        target={child.newTab ? '_blank' : undefined}
                        rel={child.newTab ? 'noopener noreferrer' : undefined}
                        className="flex-1"
                      >
                        {child.label}
                      </a>
                    )}
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  {/* Level 3 submenu */}
                  <div className="absolute left-full top-0 pl-2 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-150">
                    <ul className="bg-white border border-gray-200 rounded-lg shadow-lg min-w-48 py-1">
                      {child.children.map((grandchild) => (
                        <li key={grandchild.id}>
                          <NavLinkContent item={grandchild} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <NavLinkContent item={child} />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function Layout({ children }: Props) {
  const { items, isLoading } = useNavigation('main')

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                Y
              </div>
              <span className="text-xl font-semibold text-gray-900">Yigisoft</span>
            </a>
            <nav className="hidden sm:flex items-center gap-6">
              {isLoading ? (
                <span className="text-gray-400">...</span>
              ) : items.length > 0 ? (
                items.map((item) => <DropdownMenu key={item.id} item={item} />)
              ) : (
                // Fallback to Home if no navigation configured
                <a href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Home
                </a>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center text-white text-sm font-bold">
                Y
              </div>
              <span className="text-white font-medium">Yigisoft</span>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} Yigisoft. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
