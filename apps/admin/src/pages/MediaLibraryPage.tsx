import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadsApi, UploadItem } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { ApiErrorDisplay } from '../components/ApiErrorDisplay'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
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
          style={{ maxWidth: 120, maxHeight: 80, objectFit: 'contain' }}
        />
      )
    }

    if (item.contentType === 'application/pdf') {
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 8px',
            background: '#dc3545',
            color: 'white',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 'bold',
          }}
        >
          PDF
        </span>
      )
    }

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 8px',
          background: '#6c757d',
          color: 'white',
          borderRadius: 4,
          fontSize: 12,
        }}
      >
        FILE
      </span>
    )
  }

  return (
    <AdminLayout>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h1 style={{ margin: 0 }}>Media Library</h1>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            disabled={isUploading}
            accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            style={{
              padding: '8px 16px',
              background: isUploading ? '#ccc' : '#0066cc',
              color: 'white',
              border: 'none',
              cursor: isUploading ? 'wait' : 'pointer',
              display: 'inline-block',
            }}
          >
            {isUploading ? 'Uploading...' : '+ Upload File'}
          </label>
        </div>
      </div>

      <p style={{ color: '#666', marginBottom: 16 }}>
        Allowed: PNG, JPG, JPEG, WebP, SVG, PDF (max 10 MB)
      </p>

      <ApiErrorDisplay error={error} />

      {isLoading ? (
        <p>Loading...</p>
      ) : uploads.length === 0 ? (
        <p>No uploads yet. Upload your first file!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>Preview</th>
              <th style={{ padding: 8 }}>File Name</th>
              <th style={{ padding: 8 }}>Type</th>
              <th style={{ padding: 8 }}>Size</th>
              <th style={{ padding: 8 }}>Uploaded</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{renderPreview(item)}</td>
                <td style={{ padding: 8 }}>
                  <span title={item.originalFileName}>
                    {item.originalFileName.length > 30
                      ? item.originalFileName.substring(0, 27) + '...'
                      : item.originalFileName}
                  </span>
                </td>
                <td style={{ padding: 8 }}>
                  <code style={{ fontSize: 12 }}>{item.contentType}</code>
                </td>
                <td style={{ padding: 8 }}>{formatFileSize(item.size)}</td>
                <td style={{ padding: 8 }}>{formatDate(item.createdAt)}</td>
                <td style={{ padding: 8 }}>
                  <button
                    onClick={() => handleCopyUrl(item)}
                    style={{
                      marginRight: 8,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      background: copySuccess === item.id ? '#28a745' : undefined,
                      color: copySuccess === item.id ? 'white' : undefined,
                    }}
                  >
                    {copySuccess === item.id ? 'Copied!' : 'Copy URL'}
                  </button>
                  <a
                    href={getPublicUrl(item.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginRight: 8 }}
                  >
                    Open
                  </a>
                  <button
                    onClick={() => handleDelete(item)}
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
