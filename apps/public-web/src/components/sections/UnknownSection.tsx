interface Props {
  type: string
}

export function UnknownSection({ type }: Props) {
  // Only show in development mode
  if (import.meta.env.PROD) {
    return null
  }

  return (
    <section className="py-8 bg-yellow-50 border-y border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 text-yellow-800">
          <span className="text-xl">⚠️</span>
          <span className="font-medium">Unknown section type: "{type}"</span>
        </div>
      </div>
    </section>
  )
}
