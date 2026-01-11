import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/pages', label: 'Pages' },
    { path: '/media', label: 'Media Library' },
    { path: '/contact-messages', label: 'Contact Messages' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: 200, background: '#f5f5f5', padding: 16 }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: 18 }}>Admin</h2>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map((item) => (
              <li key={item.path} style={{ marginBottom: 8 }}>
                <Link
                  to={item.path}
                  style={{
                    textDecoration: 'none',
                    color: location.pathname === item.path ? '#0066cc' : '#333',
                    fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '12px 20px',
            borderBottom: '1px solid #ddd',
          }}
        >
          <span style={{ marginRight: 16 }}>
            {user?.displayName} ({user?.email})
          </span>
          <button onClick={logout} style={{ padding: '6px 12px' }}>
            Logout
          </button>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: 20 }}>{children}</main>
      </div>
    </div>
  )
}
