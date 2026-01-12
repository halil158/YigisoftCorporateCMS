import type { FeaturesData } from '../../types/sections'

interface Props {
  data: FeaturesData
}

export function FeaturesSection({ data }: Props) {
  return (
    <section className="py-16 bg-gray-50 sm:py-24">
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
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              {item.icon && (
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center text-2xl mb-4">
                  {item.icon}
                </div>
              )}
              <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
              {item.description && (
                <p className="mt-3 text-gray-600">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
