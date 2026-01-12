import type { Section } from '../types/sections'

export interface PageData {
  id: string
  slug: string
  title: string
  metaTitle: string | null
  metaDescription: string | null
  sections: Section[]
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

interface ApiPageResponse {
  id: string
  slug: string
  title: string
  metaTitle: string | null
  metaDescription: string | null
  sections: string // JSON string from backend
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface ContactSubmissionRequest {
  fields: Record<string, string>
}

export interface ContactSubmissionResponse {
  id: string
  createdAt: string
}

export interface ApiError {
  error: string
  details?: string[]
}

const API_BASE = '/api'

/**
 * Fetch a published page by slug
 */
export async function fetchPageBySlug(slug: string): Promise<PageData> {
  const res = await fetch(`${API_BASE}/pages/${encodeURIComponent(slug)}`)

  if (!res.ok) {
    if (res.status === 404) {
      throw new PageNotFoundError(slug)
    }
    throw new ApiRequestError('Failed to fetch page', res.status)
  }

  const data: ApiPageResponse = await res.json()

  // Parse sections JSON
  let sections: Section[] = []
  try {
    sections = JSON.parse(data.sections)
  } catch {
    console.warn('Failed to parse sections JSON for page:', slug)
  }

  return {
    ...data,
    sections,
  }
}

/**
 * Submit a contact form
 */
export async function submitContactForm(
  slug: string,
  fields: Record<string, string>
): Promise<ContactSubmissionResponse> {
  const res = await fetch(`${API_BASE}/pages/${encodeURIComponent(slug)}/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  })

  if (!res.ok) {
    const errorData: ApiError = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new ContactSubmissionError(errorData.error, errorData.details)
  }

  return res.json()
}

export class PageNotFoundError extends Error {
  constructor(public slug: string) {
    super(`Page not found: ${slug}`)
    this.name = 'PageNotFoundError'
  }
}

export class ApiRequestError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

export class ContactSubmissionError extends Error {
  constructor(message: string, public details?: string[]) {
    super(message)
    this.name = 'ContactSubmissionError'
  }
}
