import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { uploadsApi, UploadItem } from '../../api/client'
import { Button, Input } from '../ui'

interface MediaPickerModalWithIdProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (id: string | null) => void
  title?: string
}

export function MediaPickerModalWithId({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Image',
}: MediaPickerModalWithIdProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const loadUploads = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await uploadsApi.list(200)
        // Filter to images only
        setUploads(data.filter((u) => u.contentType.startsWith('image/')))
      } catch {
        setError('Failed to load media library')
      } finally {
        setIsLoading(false)
      }
    }

    loadUploads()
  }, [isOpen])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedId(null)
      setSearchQuery('')
    }
  }, [isOpen])

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const filteredUploads = uploads.filter((u) =>
    u.originalFileName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleConfirm = () => {
    onSelect(selectedId)
    onClose()
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-slate-700">
          <Input
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : filteredUploads.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No images match your search.' : 'No images uploaded yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {filteredUploads.map((upload) => {
                const isSelected = selectedId === upload.id
                const thumbUrl = upload.thumbnailUrl || upload.url
                return (
                  <button
                    key={upload.id}
                    type="button"
                    onClick={() => setSelectedId(upload.id)}
                    className={`
                      relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                      ${isSelected
                        ? 'border-primary-500 dark:border-accent-soft ring-2 ring-primary-500/20 dark:ring-accent-soft/20'
                        : 'border-transparent hover:border-gray-300 dark:hover:border-slate-600'
                      }
                    `}
                  >
                    <img
                      src={thumbUrl}
                      alt={upload.originalFileName}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 rounded-full bg-primary-500 dark:bg-accent-soft flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                      <p className="text-xs text-white truncate">{upload.originalFileName}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedId}>
            Select Image
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
