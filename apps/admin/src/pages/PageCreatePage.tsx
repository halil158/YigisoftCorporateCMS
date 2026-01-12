import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { pagesApi } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { ApiErrorDisplay } from '../components/ApiErrorDisplay'
import { Button, Input, TextArea, Card } from '../components/ui'

const DEFAULT_SECTIONS = `[
  {
    "type": "hero",
    "data": {
      "title": "Welcome"
    }
  }
]`

export function PageCreatePage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [sections, setSections] = useState(DEFAULT_SECTIONS)
  const [isPublished, setIsPublished] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Validate JSON
      try {
        JSON.parse(sections)
      } catch {
        setError({ error: 'ValidationFailed', details: ['sections must be valid JSON'] })
        setIsSubmitting(false)
        return
      }

      await pagesApi.create({
        slug,
        title,
        sections,
        isPublished,
      })
      navigate('/pages')
    } catch (err) {
      setError(err)
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

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <TextArea
              id="sections"
              label="Sections JSON *"
              value={sections}
              onChange={(e) => setSections(e.target.value)}
              required
              rows={12}
              className="font-mono text-sm"
              hint="Supported types: hero, features, cta, testimonials, gallery, contact-form"
            />

            <div>
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
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Page'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/pages')}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  )
}
