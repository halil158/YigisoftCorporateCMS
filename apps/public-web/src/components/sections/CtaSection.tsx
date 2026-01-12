import type { CtaData } from '../../types/sections'

interface Props {
  data: CtaData
}

export function CtaSection({ data }: Props) {
  return (
    <section className="py-16 bg-primary-600 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {data.title}
        </h2>
        <div className="mt-8">
          <a
            href={data.buttonUrl}
            className="inline-block rounded-lg bg-white px-8 py-4 text-lg font-semibold text-primary-700 shadow-lg hover:bg-primary-50 transition-colors"
          >
            {data.buttonText}
          </a>
        </div>
      </div>
    </section>
  )
}
