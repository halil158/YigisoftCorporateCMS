import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { contactMessagesApi, ContactMessageListItem } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import {
  Card,
  Select,
  Input,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  RowActionsMenu,
  RowAction,
  extractErrorMessage,
  TableLoading,
  TableEmpty,
  TableError,
  Badge,
} from '../components/ui'

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
      const apiError = err as { status?: number }
      if (apiError?.status === 401 || apiError?.status === 403) {
        localStorage.removeItem('token')
        navigate('/login', { replace: true })
        return
      }
      setError(err)
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
    setSkip(0)
  }

  const columnCount = 5

  return (
    <AdminLayout title="Contact Messages">
      <div className="space-y-6">
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
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Created</TableHeader>
                <TableHeader>Page Slug</TableHeader>
                <TableHeader>Recipient</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableLoading columns={columnCount} />
              ) : error ? (
                <TableError
                  columns={columnCount}
                  message={extractErrorMessage(error)}
                  onRetry={loadMessages}
                />
              ) : messages.length === 0 ? (
                <TableEmpty
                  columns={columnCount}
                  title="No messages yet"
                  message="Contact form submissions will appear here."
                  icon="message"
                />
              ) : (
                messages.map((msg) => (
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
                        <Badge variant="success">{formatDate(msg.processedAt)}</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
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
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!isLoading && !error && messages.length > 0 && (
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
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}
