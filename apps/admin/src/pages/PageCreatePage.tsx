import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { pagesApi } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { ApiErrorDisplay } from '../components/ApiErrorDisplay'
import { Button, Input, TextArea, Card, useToast, extractErrorMessage } from '../components/ui'
import { SectionBuilder, Section, createDefaultSectionData } from '../components/pageBuilder'

// Default sections for a new page
const DEFAULT_SECTIONS: Section[] = [
  {
    type: 'hero',
    data: createDefaultSectionData('hero'),
  },
]

export function PageCreatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS)
  const [sectionsJson, setSectionsJson] = useState(JSON.stringify(DEFAULT_SECTIONS, null, 2))
  const [isPublished, setIsPublished] = useState(false)

  // Advanced mode toggle
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)
  const [jsonError, setJsonError] = useState<string | null>(null)

  // Validation errors for section fields
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({})

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

      await pagesApi.create({
        slug,
        title,
        sections: jsonToSubmit,
        isPublished,
      })
      toast.success(`Page "${slug}" created successfully.`)
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

  return (
    <AdminLayout title="Create New Page">
      <div className="space-y-6">
        {/* Back link */}
        <Link
          to="/pages"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Pages
        </Link>

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
                hint="Lowercase letters, numbers, and hyphens only"
              />

              <Input
                id="title"
                label="Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="My Page Title"
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
                    rows={16}
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
                Publish immediately
              </span>
            </label>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Page'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/pages')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
