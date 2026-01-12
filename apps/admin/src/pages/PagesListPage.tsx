import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { pagesApi, PageListItem } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { ApiErrorDisplay } from '../components/ApiErrorDisplay'
import { Button, Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleString()
  } catch {
    return '—'
  }
}

export function PagesListPage() {
  const [pages, setPages] = useState<PageListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const navigate = useNavigate()

  const loadPages = async () => {
    try {
      setError(null)
      const data = await pagesApi.list()
      setPages(data)
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPages()
  }, [])

  const handleDelete = async (id: string, slug: string) => {
    if (!confirm(`Delete page "${slug}"?`)) return
    try {
      await pagesApi.delete(id)
      setPages(pages.filter((p) => p.id !== id))
    } catch (err) {
      setError(err)
    }
  }

  const handleTogglePublish = async (page: PageListItem) => {
    try {
      setError(null)
      if (page.isPublished) {
        await pagesApi.unpublish(page.id)
      } else {
        await pagesApi.publish(page.id)
      }
      await loadPages()
    } catch (err) {
      setError(err)
    }
  }

  return (
    <AdminLayout title="Pages">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <p className="text-gray-600 dark:text-gray-400">
            Manage your website pages
          </p>
          <Button onClick={() => navigate('/pages/new')}>
            + New Page
          </Button>
        </div>

        <ApiErrorDisplay error={error} />

        {/* Content */}
        <Card padding="none">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : pages.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No pages yet. Create your first page!
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Slug</TableHeader>
                  <TableHeader>Title</TableHeader>
                  <TableHeader>Published</TableHeader>
                  <TableHeader>Updated</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <code className="text-sm bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                        {page.slug}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      {page.title}
                    </TableCell>
                    <TableCell>
                      {page.isPublished ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400">
                          Draft
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(page.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/pages/${page.id}`}
                          className="text-primary-600 hover:text-primary-800 dark:text-accent-muted dark:hover:text-accent-soft text-sm font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleTogglePublish(page)}
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                        >
                          {page.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDelete(page.id, page.slug)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}
