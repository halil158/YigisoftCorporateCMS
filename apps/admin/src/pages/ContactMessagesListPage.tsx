import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { contactMessagesApi, ContactMessageListItem } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { ApiErrorDisplay } from '../components/ApiErrorDisplay'
import { Card, Select, Input, Button, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, RowActionsMenu, RowAction } from '../components/ui'

type ProcessedFilter = 'all' | 'unprocessed' | 'processed'

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
    <AdminLayout title="Contact Messages">
      <div className="space-y-6">
        <ApiErrorDisplay error={error} />

        {/* Filters */}
        <Card>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-40">
              <Select
                label="Status"
                value={processedFilter}
                onChange={(e) => {
                  setProcessedFilter(e.target.value as ProcessedFilter)
                  handleFilterChange()
                }}
              >
                <option value="all">All</option>
                <option value="unprocessed">Unprocessed</option>
                <option value="processed">Processed</option>
              </Select>
            </div>

            <div className="w-48">
              <Input
                label="Page Slug"
                value={pageSlugFilter}
                onChange={(e) => {
                  setPageSlugFilter(e.target.value)
                  handleFilterChange()
                }}
                placeholder="Filter by slug..."
              />
            </div>

            <div className="w-32">
              <Select
                label="Per Page"
                value={take}
                onChange={(e) => {
                  setTake(Number(e.target.value))
                  setSkip(0)
                }}
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Content */}
        <Card padding="none">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No contact messages yet.
            </div>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Created</TableHeader>
                    <TableHeader>Page Slug</TableHeader>
                    <TableHeader>Recipient Email</TableHeader>
                    <TableHeader>Processed</TableHeader>
                    <TableHeader className="text-right">Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {messages.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell>{formatDate(msg.createdAt)}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {msg.pageSlug}
                        </code>
                      </TableCell>
                      <TableCell>{msg.recipientEmail}</TableCell>
                      <TableCell>
                        {msg.processedAt ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {formatDate(msg.processedAt)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <RowActionsMenu
                          actions={[
                            { label: 'View', to: `/contact-messages/${msg.id}` },
                          ] as RowAction[]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {skip + 1} - {skip + messages.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePrev}
                    disabled={skip === 0}
                  >
                    &larr; Prev
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleNext}
                    disabled={messages.length < take}
                  >
                    Next &rarr;
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}
