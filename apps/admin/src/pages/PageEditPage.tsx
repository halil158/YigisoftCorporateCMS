import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { pagesApi, PageDetail } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { ApiErrorDisplay } from '../components/ApiErrorDisplay'
import { Button, Input, TextArea, Card, useToast, extractErrorMessage, ConfirmDialog } from '../components/ui'
import { SectionBuilder, Section } from '../components/pageBuilder'

export function PageEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [page, setPage] = useState<PageDetail | null>(null)

  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [sections, setSections] = useState<Section[]>([])
  const [sectionsJson, setSectionsJson] = useState('')
  const [isPublished, setIsPublished] = useState(false)

  // Advanced mode toggle
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)
  const [jsonError, setJsonError] = useState<string | null>(null)

  // Confirm dialog for unpublish
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false)
  const [isUnpublishing, setIsUnpublishing] = useState(false)

  // Validation errors for section fields
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) return

    const loadPage = async () => {
      try {
        const data = await pagesApi.get(id)
        setPage(data)
        setSlug(data.slug)
        setTitle(data.title)
        setMetaTitle(data.metaTitle || '')
        setMetaDescription(data.metaDescription || '')

        // Parse sections from JSON string
        let parsedSections: Section[] = []
        try {
          const parsed = JSON.parse(data.sections)
          if (Array.isArray(parsed)) {
            parsedSections = parsed
          }
        } catch {
          console.warn('Failed to parse sections JSON, using empty array')
        }
        setSections(parsedSections)
        setSectionsJson(JSON.stringify(parsedSections, null, 2))

        setIsPublished(data.isPublished)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadPage()
  }, [id])

  // Sync sections to JSON when sections change (builder mode)
  const handleSectionsChange = (newSections: Section[]) => {
    setSections(newSections)
    setSectionsJson(JSON.stringify(newSections, null, 2))
    setJsonError(null)
  }

  // Sync JSON to sections when JSON changes (advanced mode)
  const handleJsonChange = (json: string) => {
    setSectionsJson(json)
    try {
      const parsed = JSON.parse(json)
      if (Array.isArray(parsed)) {
        setSections(parsed as Section[])
        setJsonError(null)
      } else {
        setJsonError('Sections must be a JSON array')
      }
    } catch {
      setJsonError('Invalid JSON syntax')
    }
  }

  // Toggle between modes
  const handleToggleMode = () => {
    if (isAdvancedMode && jsonError) {
      // Don't allow switching to builder mode if JSON is invalid
      toast.error('Fix JSON errors before switching to visual editor')
      return
    }
    setIsAdvancedMode(!isAdvancedMode)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!id) return

    setError(null)
    setSectionErrors({})
    setIsSubmitting(true)

    try {
      // Validate JSON
      let jsonToSubmit = sectionsJson
      try {
        JSON.parse(jsonToSubmit)
      } catch {
        setError({ error: 'ValidationFailed', details: ['sections must be valid JSON'] })
        setIsSubmitting(false)
        return
      }

      await pagesApi.update(id, {
        slug,
        title,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        sections: jsonToSubmit,
        isPublished,
      })
      toast.success('Page saved successfully.')
      navigate('/pages')
    } catch (err: any) {
      toast.error(extractErrorMessage(err))
      setError(err)

      // Try to extract section-specific errors
      if (err?.details && Array.isArray(err.details)) {
        const errors: Record<string, string> = {}
        for (const detail of err.details) {
          if (typeof detail === 'string') {
            // Parse error like "sections[0].data.title is required"
            const match = detail.match(/^(sections\[\d+\]\.data\.[^\s]+)\s+(.+)$/)
            if (match) {
              errors[match[1]] = match[2]
            }
          }
        }
        setSectionErrors(errors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePublish = async () => {
    if (!id || !page) return

    try {
      setError(null)
      const updated = await pagesApi.publish(id)
      setPage(updated)
      setIsPublished(updated.isPublished)
      toast.success(`Page "${slug}" published.`)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const handleUnpublish = async () => {
    if (!id || !page) return

    setIsUnpublishing(true)
    try {
      setError(null)
      const updated = await pagesApi.unpublish(id)
      setPage(updated)
      setIsPublished(updated.isPublished)
      toast.success(`Page "${slug}" unpublished.`)
      setShowUnpublishConfirm(false)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsUnpublishing(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout title="Edit Page">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      </AdminLayout>
    )
  }

  if (!page && !isLoading) {
    return (
      <AdminLayout title="Edit Page">
        <ApiErrorDisplay error={error} />
        <Card>
          <p className="text-gray-600 dark:text-gray-400">Page not found.</p>
          <Link
            to="/pages"
            className="text-primary-600 hover:text-primary-800 dark:text-accent-muted dark:hover:text-accent-soft mt-4 inline-block"
          >
            Back to Pages
          </Link>
        </Card>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Edit Page">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/pages"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Pages
          </Link>
          {page?.isPublished ? (
            <Button
              variant="secondary"
              onClick={() => setShowUnpublishConfirm(true)}
            >
              Unpublish
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={handlePublish}
            >
              Publish
            </Button>
          )}
        </div>

        <ApiErrorDisplay error={error} />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Page metadata */}
          <Card>
            <div className="space-y-6">
              <Input
                id="slug"
                label="Slug *"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                placeholder="my-page-slug"
                hint="Warning: Changing the slug will break existing links to this page"
              />

              <Input
                id="title"
                label="Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="My Page Title"
              />

              <Input
                id="metaTitle"
                label="Meta Title"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="SEO title (optional)"
              />

              <TextArea
                id="metaDescription"
                label="Meta Description"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="SEO description (optional)"
                rows={3}
              />
            </div>
          </Card>

          {/* Sections */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Page Sections
                </h3>
                <button
                  type="button"
                  onClick={handleToggleMode}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-accent-muted dark:hover:text-accent-soft"
                >
                  {isAdvancedMode ? 'Switch to Visual Editor' : 'Switch to Advanced (JSON)'}
                </button>
              </div>

              {isAdvancedMode ? (
                <div>
                  <TextArea
                    id="sectionsJson"
                    value={sectionsJson}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                    error={jsonError || undefined}
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Supported types: hero, features, cta, testimonials, gallery, contact-form
                  </p>
                </div>
              ) : (
                <SectionBuilder
                  sections={sections}
                  onChange={handleSectionsChange}
                  errors={sectionErrors}
                />
              )}
            </div>
          </Card>

          {/* Publish toggle */}
          <Card>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-accent-soft dark:focus:ring-accent-soft"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Published
              </span>
            </label>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/pages')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {/* Unpublish Confirm Dialog */}
      <ConfirmDialog
        isOpen={showUnpublishConfirm}
        onClose={() => setShowUnpublishConfirm(false)}
        onConfirm={handleUnpublish}
        title="Unpublish Page"
        message={`Are you sure you want to unpublish "${slug}"? It will no longer be visible to visitors.`}
        confirmLabel="Unpublish"
        variant="warning"
        isLoading={isUnpublishing}
      />
    </AdminLayout>
  )
}
