import type { TestimonialsData } from '../../types/sections'
import { ResilientImage } from '../ResilientImage'

interface Props {
  data: TestimonialsData
}

function AvatarPlaceholder({ name }: { name: string }) {
  return (
    <div className="icon-bubble icon-bubble--small">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function TestimonialsSection({ data }: Props) {
  return (
    <section className="section-testimonials py-16 sm:py-24">
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
              className="testimonial-card"
            >
              <blockquote className="card-quote">
                "{item.quote}"
              </blockquote>
              <div className="mt-auto pt-6 flex items-center gap-4">
                {item.avatarUrl ? (
                  <ResilientImage
                    src={item.avatarUrl}
                    alt={item.name}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                    placeholder={<AvatarPlaceholder name={item.name} />}
                  />
                ) : (
                  <AvatarPlaceholder name={item.name} />
                )}
                <div>
                  <div className="font-semibold">{item.name}</div>
                  {(item.role || item.company) && (
                    <div className="text-sm" style={{ color: 'var(--color-muted-text)' }}>
                      {item.role}
                      {item.role && item.company && ' at '}
                      {item.company}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
