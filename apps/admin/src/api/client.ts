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
