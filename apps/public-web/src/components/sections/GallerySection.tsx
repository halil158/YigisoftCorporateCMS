import type { GalleryData } from '../../types/sections'
import { ResilientImage } from '../ResilientImage'

interface Props {
  data: GalleryData
}

export function GallerySection({ data }: Props) {
  // Filter out items without valid imageUrl
  const validItems = data.items.filter(item => item.imageUrl)

  if (validItems.length === 0) {
    return null // Don't render empty gallery
  }

  return (
    <section className="py-16 sm:py-24" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {data.title}
          </h2>
        </div>
        <div className="mt-12 gallery-grid">
          {validItems.map((item, index) => (
            <div key={index} className="gallery-item">
              <ResilientImage
                src={item.imageUrl}
                alt={item.alt || ''}
                className="w-full h-full object-cover"
              />
              {item.caption && (
                <div className="gallery-caption">
                  <p>{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
