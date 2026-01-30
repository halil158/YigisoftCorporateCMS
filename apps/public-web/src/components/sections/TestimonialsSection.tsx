import type { TestimonialsData } from '../../types/sections'
import { ResilientImage } from '../ResilientImage'

interface Props {
  data: TestimonialsData
}

function AvatarPlaceholder({ name }: { name: string }) {
  return (
    <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function TestimonialsSection({ data }: Props) {
  return (
    <section className="py-16 bg-white sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {data.title}
          </h2>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-xl p-8"
            >
              <blockquote className="text-gray-700 italic">
                "{item.quote}"
              </blockquote>
              <div className="mt-6 flex items-center gap-4">
                {item.avatarUrl ? (
                  <ResilientImage
                    src={item.avatarUrl}
                    alt={item.name}
                    className="w-12 h-12 rounded-full object-cover"
                    placeholder={<AvatarPlaceholder name={item.name} />}
                  />
                ) : (
                  <AvatarPlaceholder name={item.name} />
                )}
                <div>
                  <div className="font-semibold text-gray-900">{item.name}</div>
                  {(item.role || item.company) && (
                    <div className="text-sm text-gray-500">
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
