import type { HeroInnerData } from '../../types/sections'

interface Props {
  data: HeroInnerData
}

export function HeroInnerSection({ data }: Props) {
  const overlayOpacity = data.overlayOpacity ?? 50

  return (
    <section className="relative bg-gradient-to-br from-primary-700 to-primary-900 text-white">
      {/* Background image with overlay */}
      {data.backgroundImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${data.backgroundImageUrl})`,
            opacity: (100 - overlayOpacity) / 100,
          }}
        />
      )}

      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity / 100 }}
      />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {/* Breadcrumbs */}
        {data.breadcrumbs && data.breadcrumbs.length > 0 && (
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              {data.breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <svg
                      className="w-4 h-4 mx-2 text-primary-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                  {crumb.url ? (
                    <a
                      href={crumb.url}
                      className="text-primary-200 hover:text-white transition-colors"
                    >
                      {crumb.text}
                    </a>
                  ) : (
                    <span className="text-white font-medium">{crumb.text}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Title */}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          {data.title}
        </h1>

        {/* Subtitle */}
        {data.subtitle && (
          <p className="mt-4 text-lg text-primary-100 max-w-3xl">
            {data.subtitle}
          </p>
        )}
      </div>
    </section>
  )
}
