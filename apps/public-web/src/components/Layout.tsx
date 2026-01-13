import type { ReactNode } from 'react'
import { useNavigation } from '../hooks/useNavigation'
import type { NavigationItem } from '../api/client'

interface Props {
  children: ReactNode
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
                items.map((item) => <NavLink key={item.id} item={item} />)
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
