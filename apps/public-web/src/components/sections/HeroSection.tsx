import { useState, useEffect } from 'react'
import type { HeroData } from '../../types/sections'

interface Props {
  data: HeroData
}

export function HeroSection({ data }: Props) {
  const [imageLoaded, setImageLoaded] = useState(false)

  // Preload background image to check if it exists
  useEffect(() => {
    if (!data.imageUrl) return

    const img = new Image()
    img.onload = () => setImageLoaded(true)
    img.onerror = () => setImageLoaded(false)
    img.src = data.imageUrl

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [data.imageUrl])

  return (
    <section
      className="relative bg-gradient-to-br from-primary-600 to-primary-800"
      style={{ color: 'var(--color-primary-contrast)' }}
    >
      {data.imageUrl && imageLoaded && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${data.imageUrl})` }}
        />
      )}
      <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {data.title}
          </h1>
          {data.subtitle && (
            <p
              className="mt-6 text-xl max-w-3xl mx-auto"
              style={{ color: 'var(--color-primary-100)' }}
            >
              {data.subtitle}
            </p>
          )}
          {data.primaryCta?.text && data.primaryCta?.url && (
            <div className="mt-10">
              <a
                href={data.primaryCta.url}
                className="inline-block rounded-lg px-8 py-4 text-lg font-semibold shadow-lg transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary-contrast)',
                  color: 'var(--color-primary-700)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-50)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-contrast)'
                }}
              >
                {data.primaryCta.text}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
