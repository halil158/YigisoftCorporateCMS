import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchPageBySlug, PageNotFoundError, type PageData } from '../api/client'
import { SectionRenderer } from '../components/SectionRenderer'
import { NotFound } from './NotFound'
import { useSeo } from '../hooks/useSeo'

export function PageView() {
  const { slug } = useParams<{ slug: string }>()
  const [page, setPage] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Apply SEO meta tags
  useSeo({
    title: page?.metaTitle || page?.title,
    description: page?.metaDescription,
  })

  useEffect(() => {
    if (!slug) return

    setLoading(true)
    setNotFound(false)
    setError(null)

    fetchPageBySlug(slug)
      .then((data) => {
        setPage(data)
        setLoading(false)
      })
      .catch((err) => {
        setLoading(false)
        if (err instanceof PageNotFoundError) {
          setNotFound(true)
        } else {
          setError('Failed to load page. Please try again later.')
        }
      })
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (notFound) {
    return <NotFound />
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Something went wrong</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!page) {
    return null
  }

  return <SectionRenderer sections={page.sections} />
}
