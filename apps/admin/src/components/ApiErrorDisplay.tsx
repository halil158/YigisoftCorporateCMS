import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Alert } from './ui'

interface ApiErrorDisplayProps {
  error: unknown
}

interface ApiErrorShape {
  status?: number
  error?: string
  message?: string
  details?: string[]
}

export function ApiErrorDisplay({ error }: ApiErrorDisplayProps) {
  const navigate = useNavigate()
  const apiError = error as ApiErrorShape

  useEffect(() => {
    if (apiError?.status === 401 || apiError?.status === 403) {
      localStorage.removeItem('token')
      navigate('/login', { replace: true })
    }
  }, [apiError?.status, navigate])

  if (!error) return null

  // Handle validation errors with details
  if (apiError?.error === 'ValidationFailed' && apiError?.details) {
    return (
      <Alert variant="error" className="mb-4">
        <strong className="font-semibold">Validation Error:</strong>
        <ul className="mt-2 ml-4 list-disc space-y-1">
          {apiError.details.map((detail, i) => (
            <li key={i}>{detail}</li>
          ))}
        </ul>
      </Alert>
    )
  }

  // Handle other errors
  const message = apiError?.message || apiError?.error || 'An error occurred'
  return (
    <Alert variant="error" className="mb-4">
      {message}
    </Alert>
  )
}
