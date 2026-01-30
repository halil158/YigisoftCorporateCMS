import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { uploadsApi, UploadItem, MediaUsageInfo } from '../api/client'
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
  Badge,
  PageHeader,
} from '../components/ui'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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

function getPublicUrl(url: string): string {
  return `${window.location.origin}${url}`
}

// Format navigation key for display
function formatNavigationKey(key: string): string {
  const parts = key.split('.')
  if (parts.length >= 2) {
    return parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1) + ' Navigation'
  }
  return key
}

// Format settings key for display
function formatSettingsKey(key: string): string {
  if (key === 'site.branding') return 'Site Branding'
  if (key === 'site.theme') return 'Site Theme'
  return key
}

// Dialog for showing media usage
interface MediaUsageDialogProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  usage: MediaUsageInfo | null
  isDeleteBlocked?: boolean
}

function MediaUsageDialog({ isOpen, onClose, fileName, usage, isDeleteBlocked = true }: MediaUsageDialogProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !usage) return null

  const totalUsages = usage.total || usage.totalCount || 0
  const pages = usage.pages || usage.usedByPages || []
  const navigation = usage.navigation || []
  const settings = usage.settings || usage.usedBySettings || []

  const dialog = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="usage-dialog-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg transform rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800 dark:ring-1 dark:ring-slate-700">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full ${
              isDeleteBlocked
                ? 'bg-yellow-100 dark:bg-yellow-900/30'
                : 'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              {isDeleteBlocked ? (
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 id="usage-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                {isDeleteBlocked ? 'Cannot Delete File' : 'Media Usage'}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <strong>"{fileName}"</strong> is used in <strong>{totalUsages}</strong> {totalUsages === 1 ? 'place' : 'places'}.
                {isDeleteBlocked && ' Remove all references to delete this file.'}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4 max-h-60 overflow-y-auto">
            {pages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Pages ({pages.length})
                </h4>
                <ul className="space-y-1 ml-6">
                  {pages.map((page, i) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <Link
                        to={`/pages/${page.pageId}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                        onClick={onClose}
                      >
                        {page.title}
                      </Link>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        /{page.slug}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {navigation.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Navigation ({navigation.length})
                </h4>
                <ul className="space-y-1 ml-6">
                  {navigation.map((nav, i) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <Link
                        to="/navigation"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                        onClick={onClose}
                      >
                        {formatNavigationKey(nav.key)}
                      </Link>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        {nav.jsonPath}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {settings.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings ({settings.length})
                </h4>
                <ul className="space-y-1 ml-6">
                  {settings.map((setting, i) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <Link
                        to="/settings"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                        onClick={onClose}
                      >
                        {formatSettingsKey(setting.settingsKey)}
                      </Link>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        {setting.jsonPath}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {totalUsages === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                This file is not used anywhere.
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(dialog, document.body)
}

// Usage badge component
function UsageBadge({ count }: { count: number | undefined }) {
  if (count === undefined) {
    return <span className="text-gray-400 text-xs">...</span>
  }

  if (count === 0) {
    return (
      <Badge variant="neutral" size="sm">
        Unused
      </Badge>
    )
  }

  return (
    <Badge variant="info" size="sm">
      Used: {count}
    </Badge>
  )
}

export function MediaLibraryPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [deleteTarget, setDeleteTarget] = useState<UploadItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [usageInfo, setUsageInfo] = useState<{ fileName: string; usage: MediaUsageInfo; isDeleteBlocked: boolean } | null>(null)
  const [loadingUsageFor, setLoadingUsageFor] = useState<string | null>(null)

  const loadUploads = async () => {
    try {
      setError(null)
      setIsLoading(true)
      const data = await uploadsApi.list(50)
      setUploads(data)
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
    loadUploads()
  }, [])

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const newUpload = await uploadsApi.upload(file)
      // New uploads have 0 usage
      setUploads([{ ...newUpload, usageCount: 0 }, ...uploads])
      toast.success(`"${file.name}" uploaded successfully.`)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)

    try {
      await uploadsApi.delete(deleteTarget.id)
      setUploads(uploads.filter((u) => u.id !== deleteTarget.id))
      toast.success(`"${deleteTarget.originalFileName}" deleted successfully.`)
      setDeleteTarget(null)
    } catch (err) {
      const apiError = err as { status?: number; error?: string; usage?: MediaUsageInfo }
      if (apiError.status === 409 && apiError.error === 'MEDIA_IN_USE' && apiError.usage) {
        // Show usage dialog instead of generic error
        setUsageInfo({ fileName: deleteTarget.originalFileName, usage: apiError.usage, isDeleteBlocked: true })
        setDeleteTarget(null)
      } else {
        toast.error(extractErrorMessage(err))
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleShowUsage = async (item: UploadItem) => {
    setLoadingUsageFor(item.id)
    try {
      const usage = await uploadsApi.getUsage(item.id)
      setUsageInfo({ fileName: item.originalFileName, usage, isDeleteBlocked: false })
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setLoadingUsageFor(null)
    }
  }

  const handleCopyUrl = async (item: UploadItem) => {
    const url = getPublicUrl(item.url)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('URL copied to clipboard.')
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('URL copied to clipboard.')
    }
  }

  const renderPreview = (item: UploadItem) => {
    // Use thumbnail for faster list rendering, fallback to main URL
    const previewUrl = item.thumbnailUrl
      ? getPublicUrl(item.thumbnailUrl)
      : getPublicUrl(item.url)

    if (item.contentType.startsWith('image/')) {
      return (
        <img
          src={previewUrl}
          alt={item.originalFileName}
          className="max-w-[120px] max-h-[80px] object-contain rounded"
        />
      )
    }

    if (item.contentType === 'application/pdf') {
      return <Badge variant="danger" size="md">PDF</Badge>
    }

    return <Badge variant="neutral" size="md">FILE</Badge>
  }

  const columnCount = 7

  return (
    <AdminLayout title="Media Library">
      <div className="space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={isUploading}
          accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
          className="hidden"
          id="file-upload"
        />

        <PageHeader
          description="PNG, JPG, JPEG, WebP, SVG, PDF (max 10 MB)"
          actions={
            <Button
              onClick={triggerFileSelect}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : '+ Upload File'}
            </Button>
          }
        />

        <Card padding="none">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Preview</TableHeader>
                <TableHeader>File Name</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Size</TableHeader>
                <TableHeader>Used</TableHeader>
                <TableHeader>Uploaded</TableHeader>
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
                  onRetry={loadUploads}
                />
              ) : uploads.length === 0 ? (
                <TableEmpty
                  columns={columnCount}
                  title="No uploads yet"
                  message="Upload images and documents to use in your pages."
                  icon="image"
                  action={{
                    label: '+ Upload File',
                    onClick: triggerFileSelect,
                  }}
                />
              ) : (
                uploads.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{renderPreview(item)}</TableCell>
                    <TableCell>
                      <span title={item.originalFileName} className="block max-w-[200px] truncate font-medium text-gray-900 dark:text-white">
                        {item.originalFileName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                        {item.contentType}
                      </code>
                    </TableCell>
                    <TableCell>{formatFileSize(item.size)}</TableCell>
                    <TableCell>
                      <UsageBadge count={item.usageCount} />
                    </TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <RowActionsMenu
                        actions={[
                          { label: 'Copy URL', onClick: () => handleCopyUrl(item) },
                          { label: 'Open', onClick: () => window.open(getPublicUrl(item.url), '_blank') },
                          {
                            label: loadingUsageFor === item.id ? 'Loading...' : 'Where used',
                            onClick: () => handleShowUsage(item),
                            disabled: loadingUsageFor === item.id
                          },
                          { label: 'Delete', onClick: () => setDeleteTarget(item), destructive: true },
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

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete File"
        message={`Are you sure you want to delete "${deleteTarget?.originalFileName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />

      <MediaUsageDialog
        isOpen={usageInfo !== null}
        onClose={() => setUsageInfo(null)}
        fileName={usageInfo?.fileName ?? ''}
        usage={usageInfo?.usage ?? null}
        isDeleteBlocked={usageInfo?.isDeleteBlocked ?? true}
      />
    </AdminLayout>
  )
}
