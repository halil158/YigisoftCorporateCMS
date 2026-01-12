import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { contactMessagesApi, ContactMessageDetail } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { ApiErrorDisplay } from '../components/ApiErrorDisplay'
import { Card, Button, Alert } from '../components/ui'

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
      <AdminLayout title="Contact Message">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      </AdminLayout>
    )
  }

  if (!message && !isLoading) {
    return (
      <AdminLayout title="Contact Message">
        <ApiErrorDisplay error={error} />
        <Card>
          <p className="text-gray-600 dark:text-gray-400">Message not found.</p>
          <Link
            to="/contact-messages"
            className="text-primary-600 hover:text-primary-800 dark:text-accent-muted dark:hover:text-accent-soft mt-4 inline-block"
          >
            Back to Contact Messages
          </Link>
        </Card>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Contact Message">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/contact-messages"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Contact Messages
          </Link>
          {message && !message.processedAt && (
            <Button
              variant="success"
              onClick={handleMarkProcessed}
              disabled={isMarking}
            >
              {isMarking ? 'Marking...' : 'Mark as Processed'}
            </Button>
          )}
        </div>

        <ApiErrorDisplay error={error} />

        {successMessage && (
          <Alert variant="success">{successMessage}</Alert>
        )}

        {message && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summary */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Summary</h2>
              <dl className="space-y-3">
                <div className="flex">
                  <dt className="w-32 flex-shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">ID:</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    <code className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">{message.id}</code>
                  </dd>
                </div>
                <div className="flex">
                  <dt className="w-32 flex-shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">Created:</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{formatDate(message.createdAt)}</dd>
                </div>
                <div className="flex">
                  <dt className="w-32 flex-shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">Page Slug:</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    <code className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">{message.pageSlug}</code>
                  </dd>
                </div>
                <div className="flex">
                  <dt className="w-32 flex-shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">Recipient:</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{message.recipientEmail}</dd>
                </div>
                <div className="flex">
                  <dt className="w-32 flex-shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">IP:</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{message.ip || '—'}</dd>
                </div>
                <div className="flex">
                  <dt className="w-32 flex-shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">User Agent:</dt>
                  <dd className="text-sm text-gray-900 dark:text-white break-all">{message.userAgent || '—'}</dd>
                </div>
                <div className="flex">
                  <dt className="w-32 flex-shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">Processed:</dt>
                  <dd className="text-sm">
                    {message.processedAt ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {formatDate(message.processedAt)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Pending
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </Card>

            {/* Fields */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Submitted Fields</h2>
              <pre className="bg-gray-100 dark:bg-slate-700 p-4 rounded-lg overflow-auto text-sm font-mono text-gray-800 dark:text-gray-200">
                {JSON.stringify(message.fields, null, 2)}
              </pre>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
