import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { contactMessagesApi, ContactMessageDetail } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { ApiErrorDisplay } from '../components/ApiErrorDisplay'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return '—'
  }
}

export function ContactMessageDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [message, setMessage] = useState<ContactMessageDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [isMarking, setIsMarking] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleApiError = (err: unknown) => {
    const apiError = err as { status?: number }
    if (apiError?.status === 401 || apiError?.status === 403) {
      localStorage.removeItem('token')
      navigate('/login', { replace: true })
      return
    }
    setError(err)
  }

  useEffect(() => {
    if (!id) return

    const loadMessage = async () => {
      try {
        setError(null)
        const data = await contactMessagesApi.get(id)
        setMessage(data)
      } catch (err) {
        handleApiError(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadMessage()
  }, [id])

  const handleMarkProcessed = async () => {
    if (!id) return

    setIsMarking(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const updated = await contactMessagesApi.markProcessed(id)
      setMessage(updated)
      setSuccessMessage('Message marked as processed.')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsMarking(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <p>Loading...</p>
      </AdminLayout>
    )
  }

  if (!message && !isLoading) {
    return (
      <AdminLayout>
        <ApiErrorDisplay error={error} />
        <p>Message not found.</p>
        <Link to="/contact-messages">Back to Contact Messages</Link>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20 }}>
        <Link to="/contact-messages">&larr; Back to Contact Messages</Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Contact Message</h1>
        {message && !message.processedAt && (
          <button
            onClick={handleMarkProcessed}
            disabled={isMarking}
            style={{
              padding: '8px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              cursor: isMarking ? 'wait' : 'pointer',
            }}
          >
            {isMarking ? 'Marking...' : 'Mark as Processed'}
          </button>
        )}
      </div>

      <ApiErrorDisplay error={error} />

      {successMessage && (
        <div style={{ background: '#d4edda', border: '1px solid #28a745', padding: 12, marginBottom: 16, color: '#155724' }}>
          {successMessage}
        </div>
      )}

      {message && (
        <>
          {/* Summary */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Summary</h2>
            <table style={{ borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 16px 4px 0', fontWeight: 'bold' }}>ID:</td>
                  <td style={{ padding: 4 }}>
                    <code style={{ fontSize: 12 }}>{message.id}</code>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 16px 4px 0', fontWeight: 'bold' }}>Created:</td>
                  <td style={{ padding: 4 }}>{formatDate(message.createdAt)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 16px 4px 0', fontWeight: 'bold' }}>Page Slug:</td>
                  <td style={{ padding: 4 }}>
                    <code>{message.pageSlug}</code>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 16px 4px 0', fontWeight: 'bold' }}>Recipient Email:</td>
                  <td style={{ padding: 4 }}>{message.recipientEmail}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 16px 4px 0', fontWeight: 'bold' }}>IP:</td>
                  <td style={{ padding: 4 }}>{message.ip || '—'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 16px 4px 0', fontWeight: 'bold' }}>User Agent:</td>
                  <td style={{ padding: 4, maxWidth: 400, wordBreak: 'break-all' }}>
                    {message.userAgent || '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 16px 4px 0', fontWeight: 'bold' }}>Processed:</td>
                  <td style={{ padding: 4 }}>
                    {message.processedAt ? (
                      <span style={{ color: 'green' }}>{formatDate(message.processedAt)}</span>
                    ) : (
                      <span style={{ color: '#cc6600' }}>Not processed</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Fields */}
          <div>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Submitted Fields</h2>
            <pre
              style={{
                background: '#f5f5f5',
                padding: 16,
                borderRadius: 4,
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: 13,
              }}
            >
              {JSON.stringify(message.fields, null, 2)}
            </pre>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
