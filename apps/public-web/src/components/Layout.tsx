import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function Layout({ children }: Props) {
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
              <a href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                Home
              </a>
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
