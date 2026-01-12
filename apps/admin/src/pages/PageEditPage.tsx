import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { pagesApi, PageDetail } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { ApiErrorDisplay } from '../components/ApiErrorDisplay'
import { Button, Input, TextArea, Card } from '../components/ui'

export function PageEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [page, setPage] = useState<PageDetail | null>(null)

  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [sections, setSections] = useState('')
  const [isPublished, setIsPublished] = useState(false)

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
        setSections(JSON.stringify(data.sections, null, 2))
        setIsPublished(data.isPublished)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadPage()
  }, [id])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!id) return

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

      await pagesApi.update(id, {
        slug,
        title,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
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

  const handleTogglePublish = async () => {
    if (!id || !page) return

    try {
      setError(null)
      if (page.isPublished) {
        const updated = await pagesApi.unpublish(id)
        setPage(updated)
        setIsPublished(updated.isPublished)
      } else {
        const updated = await pagesApi.publish(id)
        setPage(updated)
        setIsPublished(updated.isPublished)
      }
    } catch (err) {
      setError(err)
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
            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 mt-4 inline-block"
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
          <Button
            variant={page?.isPublished ? 'secondary' : 'success'}
            onClick={handleTogglePublish}
          >
            {page?.isPublished ? 'Unpublish' : 'Publish'}
          </Button>
        </div>

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

            <TextArea
              id="sections"
              label="Sections JSON *"
              value={sections}
              onChange={(e) => setSections(e.target.value)}
              required
              rows={16}
              className="font-mono text-sm"
              hint="Supported types: hero, features, cta, testimonials, gallery, contact-form"
            />

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Published
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
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
