import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { pagesApi, PageListItem } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import {
  Button,
  Card,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  RowActionsMenu,
  RowAction,
  ConfirmDialog,
  useToast,
  extractErrorMessage,
  TableLoading,
  TableEmpty,
  TableError,
} from '../components/ui'

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

type ConfirmAction =
  | { type: 'delete'; page: PageListItem }
  | { type: 'unpublish'; page: PageListItem }
  | null

export function PagesListPage() {
  const [pages, setPages] = useState<PageListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const loadPages = async () => {
    try {
      setError(null)
      setIsLoading(true)
      const data = await pagesApi.list()
      setPages(data)
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
    loadPages()
  }, [])

  const handleDelete = async () => {
    if (confirmAction?.type !== 'delete') return

    const page = confirmAction.page
    setIsActionLoading(true)

    try {
      await pagesApi.delete(page.id)
      setPages(pages.filter((p) => p.id !== page.id))
      toast.success(`Page "${page.slug}" deleted successfully.`)
      setConfirmAction(null)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleUnpublish = async () => {
    if (confirmAction?.type !== 'unpublish') return

    const page = confirmAction.page
    setIsActionLoading(true)

    try {
      await pagesApi.unpublish(page.id)
      await loadPages()
      toast.success(`Page "${page.slug}" unpublished.`)
      setConfirmAction(null)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsActionLoading(false)
    }
  }

  const handlePublish = async (page: PageListItem) => {
    try {
      await pagesApi.publish(page.id)
      await loadPages()
      toast.success(`Page "${page.slug}" published.`)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const getConfirmDialogProps = () => {
    if (!confirmAction) return null

    if (confirmAction.type === 'delete') {
      return {
        title: 'Delete Page',
        message: `Are you sure you want to delete "${confirmAction.page.slug}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        onConfirm: handleDelete,
      }
    }

    if (confirmAction.type === 'unpublish') {
      return {
        title: 'Unpublish Page',
        message: `Are you sure you want to unpublish "${confirmAction.page.slug}"? It will no longer be visible to visitors.`,
        confirmLabel: 'Unpublish',
        variant: 'warning' as const,
        onConfirm: handleUnpublish,
      }
    }

    return null
  }

  const confirmProps = getConfirmDialogProps()
  const columnCount = 5

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

        {/* Content */}
        <Card padding="none">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Slug</TableHeader>
                <TableHeader>Title</TableHeader>
                <TableHeader>Published</TableHeader>
                <TableHeader>Updated</TableHeader>
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
                  onRetry={loadPages}
                />
              ) : pages.length === 0 ? (
                <TableEmpty
                  columns={columnCount}
                  message="No pages yet. Create your first page!"
                  icon="document"
                />
              ) : (
                pages.map((page) => (
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
                    <TableCell className="text-right">
                      <RowActionsMenu
                        actions={[
                          { label: 'Edit', to: `/pages/${page.id}` },
                          page.isPublished
                            ? {
                                label: 'Unpublish',
                                onClick: () => setConfirmAction({ type: 'unpublish', page }),
                              }
                            : {
                                label: 'Publish',
                                onClick: () => handlePublish(page),
                              },
                          {
                            label: 'Delete',
                            onClick: () => setConfirmAction({ type: 'delete', page }),
                            destructive: true,
                          },
                        ] as RowAction[]}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Confirm Dialog */}
      {confirmProps && (
        <ConfirmDialog
          isOpen={confirmAction !== null}
          onClose={() => setConfirmAction(null)}
          onConfirm={confirmProps.onConfirm}
          title={confirmProps.title}
          message={confirmProps.message}
          confirmLabel={confirmProps.confirmLabel}
          variant={confirmProps.variant || 'danger'}
          isLoading={isActionLoading}
        />
      )}
    </AdminLayout>
  )
}
