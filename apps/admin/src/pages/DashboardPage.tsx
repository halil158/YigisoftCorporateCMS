import { Link } from 'react-router-dom'
import { AdminLayout } from '../components/AdminLayout'
import { Card } from '../components/ui'

function QuickActionCard({ to, title, description, icon }: { to: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <Link to={to} className="block">
      <Card className="hover:border-primary-300 dark:hover:border-primary-700 transition-colors h-full">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export function DashboardPage() {
  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome card */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">Y</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Welcome to YigisoftCorporateCMS
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your website content from this admin panel.
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickActionCard
              to="/pages"
              title="Manage Pages"
              description="View and edit all your website pages"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <QuickActionCard
              to="/pages/new"
              title="Create New Page"
              description="Add a new page to your website"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            />
            <QuickActionCard
              to="/media"
              title="Media Library"
              description="Upload and manage images and files"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <QuickActionCard
              to="/contact-messages"
              title="Contact Messages"
              description="View and manage contact form submissions"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
