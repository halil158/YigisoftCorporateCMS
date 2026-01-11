import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

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
      <div style={{ background: '#fee', border: '1px solid #c00', padding: 12, marginBottom: 16 }}>
        <strong>Validation Error:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
          {apiError.details.map((detail, i) => (
            <li key={i}>{detail}</li>
          ))}
        </ul>
      </div>
    )
  }

  // Handle other errors
  const message = apiError?.message || apiError?.error || 'An error occurred'
  return (
    <div style={{ background: '#fee', border: '1px solid #c00', padding: 12, marginBottom: 16 }}>
      {message}
    </div>
  )
}
