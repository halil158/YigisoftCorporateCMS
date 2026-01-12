import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadsApi, UploadItem } from '../api/client'
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const newUpload = await uploadsApi.upload(file)
      setUploads([newUpload, ...uploads])
      toast.success(`"${file.name}" uploaded successfully.`)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsUploading(false)
      // Reset file input
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
      toast.error(extractErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCopyUrl = async (item: UploadItem) => {
    const url = getPublicUrl(item.url)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('URL copied to clipboard.')
    } catch {
      // Fallback for older browsers
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
    const url = getPublicUrl(item.url)

    if (item.contentType.startsWith('image/')) {
      return (
        <img
          src={url}
          alt={item.originalFileName}
          className="max-w-[120px] max-h-[80px] object-contain rounded"
        />
      )
    }

    if (item.contentType === 'application/pdf') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          PDF
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400">
        FILE
      </span>
    )
  }

  const columnCount = 6

  return (
    <AdminLayout title="Media Library">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-gray-600 dark:text-gray-400">
            Allowed: PNG, JPG, JPEG, WebP, SVG, PDF (max 10 MB)
          </p>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              disabled={isUploading}
              accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                as="span"
                disabled={isUploading}
                className={isUploading ? 'cursor-wait' : 'cursor-pointer'}
              >
                {isUploading ? 'Uploading...' : '+ Upload File'}
              </Button>
            </label>
          </div>
        </div>

        {/* Content */}
        <Card padding="none">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Preview</TableHeader>
                <TableHeader>File Name</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Size</TableHeader>
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
                  message="No uploads yet. Upload your first file!"
                  icon="image"
                />
              ) : (
                uploads.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{renderPreview(item)}</TableCell>
                    <TableCell>
                      <span title={item.originalFileName} className="block max-w-[200px] truncate">
                        {item.originalFileName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                        {item.contentType}
                      </code>
                    </TableCell>
                    <TableCell>{formatFileSize(item.size)}</TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <RowActionsMenu
                        actions={[
                          { label: 'Copy URL', onClick: () => handleCopyUrl(item) },
                          { label: 'Open', onClick: () => window.open(getPublicUrl(item.url), '_blank') },
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

      {/* Delete Confirm Dialog */}
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
    </AdminLayout>
  )
}
