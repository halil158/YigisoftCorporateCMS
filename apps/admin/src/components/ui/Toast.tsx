import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'

// Types
export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  dismiss: (id: string) => void
}

// Context
const ToastContext = createContext<ToastContextValue | null>(null)

// Hook to use toast
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Helper to extract error message from API errors
interface ApiErrorShape {
  status?: number
  error?: string
  message?: string
  details?: string[]
}

export function extractErrorMessage(err: unknown): string {
  const apiError = err as ApiErrorShape

  // Handle validation errors with details
  if (apiError?.error === 'ValidationFailed' && apiError?.details?.length) {
    return apiError.details[0]
  }

  // Handle rate limiting
  if (apiError?.status === 429) {
    return apiError.message || 'Too many requests. Please try again later.'
  }

  // Handle auth errors
  if (apiError?.status === 401) {
    return 'Session expired. Please log in again.'
  }

  if (apiError?.status === 403) {
    return 'You do not have permission to perform this action.'
  }

  // Handle not found
  if (apiError?.status === 404) {
    return apiError.message || 'The requested resource was not found.'
  }

  // Handle conflict
  if (apiError?.status === 409) {
    return apiError.message || 'A conflict occurred. The resource may already exist.'
  }

  // Default message
  return apiError?.message || apiError?.error || 'An unexpected error occurred.'
}

// Generate unique ID
let toastCounter = 0
function generateId(): string {
  return `toast-${++toastCounter}-${Date.now()}`
}

// Toast duration in ms
const TOAST_DURATION = 4000

// Provider component
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = generateId()
    setToasts((prev) => [...prev, { id, message, variant }])

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, TOAST_DURATION)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((message: string) => addToast(message, 'success'), [addToast])
  const error = useCallback((message: string) => addToast(message, 'error'), [addToast])
  const info = useCallback((message: string) => addToast(message, 'info'), [addToast])

  return (
    <ToastContext.Provider value={{ success, error, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// Toast container (renders via portal)
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  const container = (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )

  return createPortal(container, document.body)
}

// Individual toast item
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage
  onDismiss: (id: string) => void
}) {
  const variantStyles = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: 'text-emerald-600 dark:text-emerald-400',
      text: 'text-emerald-800 dark:text-emerald-200',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      text: 'text-red-800 dark:text-red-200',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-800 dark:text-blue-200',
    },
  }

  const styles = variantStyles[toast.variant]

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in
                  ${styles.bg} ${styles.border}`}
    >
      <span className={`flex-shrink-0 ${styles.icon}`}>{icons[toast.variant]}</span>
      <p className={`flex-1 text-sm font-medium ${styles.text}`}>{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className={`flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${styles.icon}`}
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
