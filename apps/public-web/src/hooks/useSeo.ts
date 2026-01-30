import { useEffect } from 'react'
import { useBranding } from './useBranding'

interface SeoOptions {
  title?: string | null
  description?: string | null
  ogImage?: string | null
}

export function useSeo({ title, description, ogImage }: SeoOptions) {
  const { branding } = useBranding()
  const siteName = branding.siteName || 'Yigisoft'

  useEffect(() => {
    // Update document title
    document.title = title ? `${title} | ${siteName}` : siteName

    // Update meta description
    updateMeta('description', description || '')

    // Update og:title
    updateMeta('og:title', title || siteName, true)

    // Update og:description
    updateMeta('og:description', description || '', true)

    // Update og:image (page-specific or default from branding)
    const imageUrl = ogImage || branding.defaultOgImageUrl
    if (imageUrl) {
      updateMeta('og:image', imageUrl, true)
    }

    // Update og:site_name
    updateMeta('og:site_name', siteName, true)

    // Update favicon
    if (branding.faviconUrl) {
      updateLink('icon', branding.faviconUrl)
    }

    // Update apple-touch-icon
    if (branding.appleTouchIconUrl) {
      updateLink('apple-touch-icon', branding.appleTouchIconUrl)
    }

    // Cleanup on unmount
    return () => {
      document.title = siteName
    }
  }, [title, description, ogImage, branding, siteName])
}

function updateMeta(name: string, content: string, isProperty = false) {
  const attrName = isProperty ? 'property' : 'name'
  let meta = document.querySelector(`meta[${attrName}="${name}"]`) as HTMLMetaElement | null

  if (content) {
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute(attrName, name)
      document.head.appendChild(meta)
    }
    meta.content = content
  } else if (meta) {
    meta.remove()
  }
}

function updateLink(rel: string, href: string) {
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.rel = rel
    document.head.appendChild(link)
  }
  link.href = href
}
