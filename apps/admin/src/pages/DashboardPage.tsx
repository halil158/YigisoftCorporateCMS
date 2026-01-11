import { Link } from 'react-router-dom'
import { AdminLayout } from '../components/AdminLayout'

export function DashboardPage() {
  return (
    <AdminLayout>
      <h1>Dashboard</h1>
      <p>Welcome to the YigisoftCorporateCMS Admin Panel.</p>

      <div style={{ marginTop: 24 }}>
        <h2>Quick Actions</h2>
        <ul>
          <li>
            <Link to="/pages">Manage Pages</Link>
          </li>
          <li>
            <Link to="/pages/new">Create New Page</Link>
          </li>
          <li>
            <Link to="/media">Media Library</Link>
          </li>
          <li>
            <Link to="/contact-messages">Contact Messages</Link>
          </li>
        </ul>
      </div>
    </AdminLayout>
  )
}
