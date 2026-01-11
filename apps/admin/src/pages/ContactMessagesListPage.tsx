import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { contactMessagesApi, ContactMessageListItem } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { ApiErrorDisplay } from '../components/ApiErrorDisplay'

type ProcessedFilter = 'all' | 'unprocessed' | 'processed'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return '—'
  }
}

export function ContactMessagesListPage() {
  const navigate = useNavigate()

  const [messages, setMessages] = useState<ContactMessageListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  // Filters
  const [processedFilter, setProcessedFilter] = useState<ProcessedFilter>('all')
  const [pageSlugFilter, setPageSlugFilter] = useState('')

  // Pagination
  const [skip, setSkip] = useState(0)
  const [take, setTake] = useState(20)

  const handleApiError = (err: unknown) => {
    const apiError = err as { status?: number }
    if (apiError?.status === 401 || apiError?.status === 403) {
      localStorage.removeItem('token')
      navigate('/login', { replace: true })
      return
    }
    setError(err)
  }

  const loadMessages = async () => {
    try {
      setError(null)
      setIsLoading(true)

      const params: { pageSlug?: string; processed?: boolean; skip: number; take: number } = {
        skip,
        take: Math.min(take, 200),
      }

      if (pageSlugFilter.trim()) {
        params.pageSlug = pageSlugFilter.trim()
      }

      if (processedFilter === 'processed') {
        params.processed = true
      } else if (processedFilter === 'unprocessed') {
        params.processed = false
      }

      const data = await contactMessagesApi.list(params)
      setMessages(data)
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [processedFilter, pageSlugFilter, skip, take])

  const handlePrev = () => {
    if (skip >= take) {
      setSkip(skip - take)
    }
  }

  const handleNext = () => {
    if (messages.length === take) {
      setSkip(skip + take)
    }
  }

  const handleFilterChange = () => {
    setSkip(0) // Reset to first page when filters change
  }

  return (
    <AdminLayout>
      <h1 style={{ marginBottom: 20 }}>Contact Messages</h1>

      <ApiErrorDisplay error={error} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Status</label>
          <select
            value={processedFilter}
            onChange={(e) => {
              setProcessedFilter(e.target.value as ProcessedFilter)
              handleFilterChange()
            }}
            style={{ padding: '6px 12px' }}
          >
            <option value="all">All</option>
            <option value="unprocessed">Unprocessed</option>
            <option value="processed">Processed</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Page Slug</label>
          <input
            type="text"
            value={pageSlugFilter}
            onChange={(e) => {
              setPageSlugFilter(e.target.value)
              handleFilterChange()
            }}
            placeholder="Filter by slug..."
            style={{ padding: '6px 12px', width: 180 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Per Page</label>
          <select
            value={take}
            onChange={(e) => {
              setTake(Number(e.target.value))
              setSkip(0)
            }}
            style={{ padding: '6px 12px' }}
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : messages.length === 0 ? (
        <p style={{ color: '#666' }}>No contact messages yet.</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                <th style={{ padding: 8 }}>Created</th>
                <th style={{ padding: 8 }}>Page Slug</th>
                <th style={{ padding: 8 }}>Recipient Email</th>
                <th style={{ padding: 8 }}>Processed</th>
                <th style={{ padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{formatDate(msg.createdAt)}</td>
                  <td style={{ padding: 8 }}>
                    <code>{msg.pageSlug}</code>
                  </td>
                  <td style={{ padding: 8 }}>{msg.recipientEmail}</td>
                  <td style={{ padding: 8 }}>
                    {msg.processedAt ? (
                      <span style={{ color: 'green' }}>{formatDate(msg.processedAt)}</span>
                    ) : (
                      <span style={{ color: '#999' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    <Link to={`/contact-messages/${msg.id}`}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={handlePrev}
              disabled={skip === 0}
              style={{ padding: '6px 12px', cursor: skip === 0 ? 'not-allowed' : 'pointer' }}
            >
              &larr; Prev
            </button>
            <span style={{ color: '#666' }}>
              Showing {skip + 1} - {skip + messages.length}
            </span>
            <button
              onClick={handleNext}
              disabled={messages.length < take}
              style={{ padding: '6px 12px', cursor: messages.length < take ? 'not-allowed' : 'pointer' }}
            >
              Next &rarr;
            </button>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
