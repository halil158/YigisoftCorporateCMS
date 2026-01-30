import type { FeaturesData } from '../../types/sections'

interface Props {
  data: FeaturesData
}

export function FeaturesSection({ data }: Props) {
  return (
    <section className="section-features py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {data.title}
          </h2>
        </div>
        {/* CSS Grid with equal-height cards */}
        <div className="mt-12 cards-grid">
          {data.items.map((item, index) => (
            <div
              key={index}
              className="feature-card"
            >
              {item.icon && (
                <div className="icon-bubble">
                  {item.icon}
                </div>
              )}
              <h3 className="card-title">{item.title}</h3>
              {item.description && (
                <p className="card-description">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
