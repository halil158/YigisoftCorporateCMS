import { useEffect } from 'react'

interface SeoOptions {
  title?: string | null
  description?: string | null
}

const DEFAULT_TITLE = 'Yigisoft'

export function useSeo({ title, description }: SeoOptions) {
  useEffect(() => {
    // Update document title
    document.title = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (description) {
      if (!metaDescription) {
        metaDescription = document.createElement('meta')
        metaDescription.setAttribute('name', 'description')
        document.head.appendChild(metaDescription)
      }
      metaDescription.setAttribute('content', description)
    } else if (metaDescription) {
      metaDescription.remove()
    }

    // Cleanup on unmount
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [title, description])
}
