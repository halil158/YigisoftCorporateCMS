import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { pagesApi, PageListItem } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { ApiErrorDisplay } from '../components/ApiErrorDisplay'

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Pages</h1>
        <button
          onClick={() => navigate('/pages/new')}
          style={{ padding: '8px 16px', background: '#0066cc', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          + New Page
        </button>
      </div>

      <ApiErrorDisplay error={error} />

      {isLoading ? (
        <p>Loading...</p>
      ) : pages.length === 0 ? (
        <p>No pages yet. Create your first page!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>Slug</th>
              <th style={{ padding: 8 }}>Title</th>
              <th style={{ padding: 8 }}>Published</th>
              <th style={{ padding: 8 }}>Updated</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>
                  <code>{page.slug}</code>
                </td>
                <td style={{ padding: 8 }}>{page.title}</td>
                <td style={{ padding: 8 }}>
                  <span style={{ color: page.isPublished ? 'green' : '#999' }}>
                    {page.isPublished ? 'Yes' : 'No'}
                  </span>
                </td>
                <td style={{ padding: 8 }}>{formatDate(page.updatedAt)}</td>
                <td style={{ padding: 8 }}>
                  <Link to={`/pages/${page.id}`} style={{ marginRight: 8 }}>
                    Edit
                  </Link>
                  <button
                    onClick={() => handleTogglePublish(page)}
                    style={{ marginRight: 8, padding: '4px 8px', cursor: 'pointer' }}
                  >
                    {page.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleDelete(page.id, page.slug)}
                    style={{ padding: '4px 8px', cursor: 'pointer', color: 'red' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminLayout>
  )
}
