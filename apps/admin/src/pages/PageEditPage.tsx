import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { pagesApi, PageDetail } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { ApiErrorDisplay } from '../components/ApiErrorDisplay'

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
      <AdminLayout>
        <p>Loading...</p>
      </AdminLayout>
    )
  }

  if (!page && !isLoading) {
    return (
      <AdminLayout>
        <ApiErrorDisplay error={error} />
        <p>Page not found.</p>
        <Link to="/pages">Back to Pages</Link>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20 }}>
        <Link to="/pages">&larr; Back to Pages</Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Edit Page</h1>
        <button
          onClick={handleTogglePublish}
          style={{
            padding: '8px 16px',
            background: page?.isPublished ? '#cc6600' : '#00cc66',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {page?.isPublished ? 'Unpublish' : 'Publish'}
        </button>
      </div>

      <ApiErrorDisplay error={error} />

      <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="slug" style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
            Slug *
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            placeholder="my-page-slug"
            style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
          />
          <small style={{ color: '#666' }}>
            Warning: Changing the slug will break existing links to this page
          </small>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="title" style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="My Page Title"
            style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="metaTitle" style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
            Meta Title
          </label>
          <input
            id="metaTitle"
            type="text"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="SEO title (optional)"
            style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="metaDescription" style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
            Meta Description
          </label>
          <textarea
            id="metaDescription"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="SEO description (optional)"
            rows={3}
            style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="sections" style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
            Sections JSON *
          </label>
          <textarea
            id="sections"
            value={sections}
            onChange={(e) => setSections(e.target.value)}
            required
            rows={16}
            style={{ width: '100%', padding: 8, boxSizing: 'border-box', fontFamily: 'monospace' }}
          />
          <small style={{ color: '#666' }}>
            Supported types: hero, features, cta, testimonials, gallery, contact-form
          </small>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            Published
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '8px 16px',
              background: '#0066cc',
              color: 'white',
              border: 'none',
              cursor: isSubmitting ? 'wait' : 'pointer',
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/pages')}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </AdminLayout>
  )
}
