import type { ContentBlockData } from '../../types/sections'

interface Props {
  data: ContentBlockData
}

export function ContentBlockSection({ data }: Props) {
  const layout = data.layout || 'text-left'
  const variant = data.variant || 'default'

  // Variant styles
  const variantStyles = {
    default: 'bg-white',
    highlight: 'bg-primary-50',
    muted: 'bg-gray-50',
  }

  // Layout-specific content order
  const isTextCenter = layout === 'text-center'
  const isTextRight = layout === 'text-right'

  const textContent = (
    <div className={isTextCenter ? 'text-center' : ''}>
      <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
        {data.title}
      </h2>
      {data.subtitle && (
        <p className="mt-2 text-lg text-primary-600 font-medium">
          {data.subtitle}
        </p>
      )}
      {data.content && (
        <div
          className="mt-6 text-lg text-gray-600 prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: data.content }}
        />
      )}
    </div>
  )

  const imageContent = data.imageUrl ? (
    <div className="relative">
      <img
        src={data.imageUrl}
        alt={data.title}
        className="w-full h-auto rounded-lg shadow-lg object-cover"
      />
    </div>
  ) : null

  // Text-center layout
  if (isTextCenter) {
    return (
      <section className={`py-16 sm:py-24 ${variantStyles[variant]}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {imageContent && <div className="mb-10">{imageContent}</div>}
          {textContent}
        </div>
      </section>
    )
  }

  // Side-by-side layouts
  return (
    <section className={`py-16 sm:py-24 ${variantStyles[variant]}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {isTextRight ? (
            <>
              {imageContent || <div />}
              {textContent}
            </>
          ) : (
            <>
              {textContent}
              {imageContent || <div />}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
