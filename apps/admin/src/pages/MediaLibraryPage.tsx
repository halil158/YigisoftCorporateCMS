import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadsApi, UploadItem } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { ApiErrorDisplay } from '../components/ApiErrorDisplay'
import { Button, Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, RowActionsMenu, RowAction } from '../components/ui'

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

  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  const loadUploads = async () => {
    try {
      setError(null)
      const data = await uploadsApi.list(50)
      setUploads(data)
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }

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
    loadUploads()
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setIsUploading(true)

    try {
      const newUpload = await uploadsApi.upload(file)
      setUploads([newUpload, ...uploads])
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (item: UploadItem) => {
    if (!confirm(`Delete "${item.originalFileName}"?`)) return

    try {
      await uploadsApi.delete(item.id)
      setUploads(uploads.filter((u) => u.id !== item.id))
    } catch (err) {
      handleApiError(err)
    }
  }

  const handleCopyUrl = async (item: UploadItem) => {
    const url = getPublicUrl(item.url)
    try {
      await navigator.clipboard.writeText(url)
      setCopySuccess(item.id)
      setTimeout(() => setCopySuccess(null), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(item.id)
      setTimeout(() => setCopySuccess(null), 2000)
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

        <ApiErrorDisplay error={error} />

        {/* Content */}
        <Card padding="none">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : uploads.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No uploads yet. Upload your first file!
            </div>
          ) : (
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
                {uploads.map((item) => (
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
                          { label: copySuccess === item.id ? 'Copied!' : 'Copy URL', onClick: () => handleCopyUrl(item) },
                          { label: 'Open', onClick: () => window.open(getPublicUrl(item.url), '_blank') },
                          { label: 'Delete', onClick: () => handleDelete(item), destructive: true },
                        ] as RowAction[]}
                      />
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
