import type { HeroData } from '../../types/sections'

interface Props {
  data: HeroData
}

export function HeroSection({ data }: Props) {
  return (
    <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
      {data.imageUrl && (
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
            <p className="mt-6 text-xl text-primary-100 max-w-3xl mx-auto">
              {data.subtitle}
            </p>
          )}
          {data.primaryCta?.text && data.primaryCta?.url && (
            <div className="mt-10">
              <a
                href={data.primaryCta.url}
                className="inline-block rounded-lg bg-white px-8 py-4 text-lg font-semibold text-primary-700 shadow-lg hover:bg-primary-50 transition-colors"
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
