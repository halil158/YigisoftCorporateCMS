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
  sections: string // JSON string from API, must be parsed
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

// Uploads API types
export interface UploadItem {
  id: string
  url: string
  thumbnailUrl: string | null
  fileName: string
  originalFileName: string
  contentType: string
  size: number
  width: number | null
  height: number | null
  createdAt: string
  uploadedByUserId: string
}

// Special upload function for multipart/form-data
async function uploadFile(file: File): Promise<UploadItem> {
  const token = localStorage.getItem('token')
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/admin/uploads`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw {
      status: response.status,
      ...errorBody,
    }
  }

  return response.json()
}

export const uploadsApi = {
  list: (take: number = 50) =>
    apiRequest<UploadItem[]>(`/admin/uploads?take=${take}`),

  upload: (file: File) => uploadFile(file),

  delete: (id: string) =>
    apiRequest<void>(`/admin/uploads/${id}`, {
      method: 'DELETE',
    }),
}

// Contact Messages API types
export interface ContactMessageListItem {
  id: string
  pageSlug: string
  recipientEmail: string
  createdAt: string
  processedAt: string | null
}

export interface ContactMessageDetail {
  id: string
  pageSlug: string
  recipientEmail: string
  fields: Record<string, unknown>
  createdAt: string
  ip: string | null
  userAgent: string | null
  processedAt: string | null
}

export interface ContactMessagesListParams {
  pageSlug?: string
  processed?: boolean
  skip?: number
  take?: number
}

export const contactMessagesApi = {
  list: (params: ContactMessagesListParams = {}) => {
    const searchParams = new URLSearchParams()
    if (params.pageSlug) searchParams.set('pageSlug', params.pageSlug)
    if (params.processed !== undefined) searchParams.set('processed', String(params.processed))
    if (params.skip !== undefined) searchParams.set('skip', String(params.skip))
    if (params.take !== undefined) searchParams.set('take', String(params.take))
    const query = searchParams.toString()
    return apiRequest<ContactMessageListItem[]>(`/admin/contact-messages${query ? `?${query}` : ''}`)
  },

  get: (id: string) =>
    apiRequest<ContactMessageDetail>(`/admin/contact-messages/${id}`),

  markProcessed: (id: string) =>
    apiRequest<ContactMessageDetail>(`/admin/contact-messages/${id}/mark-processed`, {
      method: 'PATCH',
    }),
}
