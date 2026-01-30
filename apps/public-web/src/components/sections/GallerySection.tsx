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
    <section className="py-16 bg-white sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {data.title}
          </h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {validItems.map((item, index) => (
            <div key={index} className="group relative overflow-hidden rounded-xl">
              <ResilientImage
                src={item.imageUrl}
                alt={item.alt || ''}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {item.caption && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                  <p className="p-4 text-white text-sm">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
