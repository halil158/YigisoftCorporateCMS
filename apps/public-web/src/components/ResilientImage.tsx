import { useState, useCallback } from 'react'

interface ResilientImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  /** Placeholder to show when image fails to load. Defaults to a gray box. */
  placeholder?: 'gray' | 'hide' | React.ReactNode
  /** Fallback text shown on the gray placeholder (first letter of alt by default) */
  fallbackText?: string
}

/**
 * An image component that handles missing/broken images gracefully.
 * Shows a placeholder instead of a broken image icon.
 */
export function ResilientImage({
  src,
  alt,
  className = '',
  placeholder = 'gray',
  fallbackText,
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = useCallback(() => {
    setHasError(true)
    setIsLoading(false)
  }, [])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  // No src provided or error occurred
  if (!src || hasError) {
    if (placeholder === 'hide') {
      return null
    }

    if (typeof placeholder !== 'string') {
      return <>{placeholder}</>
    }

    // Default gray placeholder
    const displayText = fallbackText || alt?.charAt(0)?.toUpperCase() || '?'
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center text-gray-400 ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="text-2xl font-medium">{displayText}</span>
      </div>
    )
  }

  return (
    <>
      {isLoading && (
        <div
          className={`bg-gray-100 animate-pulse ${className}`}
          aria-hidden="true"
        />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </>
  )
}

interface ResilientBackgroundProps {
  src: string | null | undefined
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  /** Whether to hide the element entirely if image fails */
  hideOnError?: boolean
}

/**
 * A div with background-image that handles missing images gracefully.
 * Falls back to showing the element without the background if image fails.
 */
export function ResilientBackground({
  src,
  className = '',
  style = {},
  children,
  hideOnError = false,
}: ResilientBackgroundProps) {
  const [hasError, setHasError] = useState(false)

  // Preload image to detect errors
  useState(() => {
    if (!src) return

    const img = new Image()
    img.onload = () => setHasError(false)
    img.onerror = () => setHasError(true)
    img.src = src
  })

  if (!src || (hasError && hideOnError)) {
    return null
  }

  const backgroundStyle: React.CSSProperties = hasError
    ? style
    : {
        ...style,
        backgroundImage: `url(${src})`,
      }

  return (
    <div className={className} style={backgroundStyle}>
      {children}
    </div>
  )
}
