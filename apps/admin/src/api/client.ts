const API_BASE = '/api'

export interface ApiError {
  error: string
  message?: string
  details?: string[]
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw {
      status: response.status,
      ...errorBody,
    }
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  expiresAt: string
}

export interface UserInfo {
  email: string
  displayName: string
  roles: string[]
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => apiRequest<UserInfo>('/auth/me'),
}

// Pages API types
export interface PageListItem {
  id: string
  slug: string
  title: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface PageDetail {
  id: string
  slug: string
  title: string
  metaTitle: string | null
  metaDescription: string | null
  sections: unknown[]
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface PageCreateRequest {
  slug: string
  title: string
  metaTitle?: string
  metaDescription?: string
  sections: string // JSON string
  isPublished: boolean
}

export interface PageUpdateRequest {
  slug: string
  title: string
  metaTitle?: string
  metaDescription?: string
  sections: string // JSON string
  isPublished: boolean
}

export const pagesApi = {
  list: () => apiRequest<PageListItem[]>('/admin/pages'),

  get: (id: string) => apiRequest<PageDetail>(`/admin/pages/${id}`),

  create: (data: PageCreateRequest) =>
    apiRequest<PageDetail>('/admin/pages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: PageUpdateRequest) =>
    apiRequest<PageDetail>(`/admin/pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/admin/pages/${id}`, {
      method: 'DELETE',
    }),

  publish: (id: string) =>
    apiRequest<PageDetail>(`/admin/pages/${id}/publish`, {
      method: 'POST',
    }),

  unpublish: (id: string) =>
    apiRequest<PageDetail>(`/admin/pages/${id}/unpublish`, {
      method: 'POST',
    }),
}
