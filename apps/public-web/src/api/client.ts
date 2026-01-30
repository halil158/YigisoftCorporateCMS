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

// Navigation types
export type NavigationItemType = 'page' | 'external' | 'group'

export interface NavigationItem {
  id: string
  label: string
  type: NavigationItemType
  slug?: string
  url?: string
  order: number
  isVisible: boolean
  newTab?: boolean
  children: NavigationItem[]
}

export interface NavigationData {
  key: string
  items: NavigationItem[]
}

/**
 * Fetch navigation by key
 */
export async function fetchNavigation(key: string): Promise<NavigationData> {
  const res = await fetch(`${API_BASE}/public/navigation?key=${encodeURIComponent(key)}`)

  if (!res.ok) {
    throw new ApiRequestError('Failed to fetch navigation', res.status)
  }

  return res.json()
}

// Settings types
export interface SettingsData {
  key: string
  data: Record<string, unknown>
  updatedAt: string
}

export interface ResolvedBrandingSettings {
  siteName: string | null
  logoLightUrl: string | null
  logoDarkUrl: string | null
  faviconUrl: string | null
  appleTouchIconUrl: string | null
  defaultOgImageUrl: string | null
}

export interface ThemeTokens {
  primary?: string | null
  primaryContrast?: string | null
  accent?: string | null
  background?: string | null
  surface?: string | null
  text?: string | null
  mutedText?: string | null
  border?: string | null
}

export interface ThemeSettings {
  mode: string
  tokens?: ThemeTokens
}

/**
 * Fetch resolved branding settings (with media URLs)
 */
export async function fetchBranding(): Promise<ResolvedBrandingSettings> {
  const res = await fetch(`${API_BASE}/public/settings/site.branding/resolved`)

  if (!res.ok) {
    throw new ApiRequestError('Failed to fetch branding', res.status)
  }

  return res.json()
}

/**
 * Fetch theme settings
 */
export async function fetchTheme(): Promise<ThemeSettings> {
  const res = await fetch(`${API_BASE}/public/settings/site.theme`)

  if (!res.ok) {
    throw new ApiRequestError('Failed to fetch theme', res.status)
  }

  const data: SettingsData = await res.json()
  return data.data as unknown as ThemeSettings
}
