import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { pagesApi } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { ApiErrorDisplay } from '../components/ApiErrorDisplay'

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
    <AdminLayout>
      <div style={{ marginBottom: 20 }}>
        <Link to="/pages">&larr; Back to Pages</Link>
      </div>

      <h1>Create New Page</h1>

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
          <small style={{ color: '#666' }}>Lowercase letters, numbers, and hyphens only</small>
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
          <label htmlFor="sections" style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
            Sections JSON *
          </label>
          <textarea
            id="sections"
            value={sections}
            onChange={(e) => setSections(e.target.value)}
            required
            rows={12}
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
            Publish immediately
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
            {isSubmitting ? 'Creating...' : 'Create Page'}
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
