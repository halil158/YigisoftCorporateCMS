import { useAuth } from '../auth/AuthContext'

export function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div style={{ padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Admin Dashboard</h1>
        <div>
          <span style={{ marginRight: 16 }}>
            {user?.displayName} ({user?.email})
          </span>
          <button onClick={logout} style={{ padding: '8px 16px' }}>
            Logout
          </button>
        </div>
      </header>
      <main>
        <p>Welcome to the YigisoftCorporateCMS Admin Panel.</p>
        <p>This is a placeholder dashboard. Future phases will add:</p>
        <ul>
          <li>Pages management (Phase 2.1)</li>
          <li>Media library (Phase 2.2)</li>
          <li>Contact messages (Phase 2.3)</li>
        </ul>
      </main>
    </div>
  )
}
