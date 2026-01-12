import { Input, TextArea, Button } from '../../ui'
import { ImageInput } from '../ImageInput'
import { TestimonialsData, TestimonialItem } from '../types'

interface TestimonialsEditorProps {
  data: TestimonialsData
  onChange: (data: TestimonialsData) => void
  errors?: Record<string, string>
}

export function TestimonialsEditor({ data, onChange, errors = {} }: TestimonialsEditorProps) {
  const items = data.items || []

  const updateItem = (index: number, partial: Partial<TestimonialItem>) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], ...partial }
    onChange({ ...data, items: newItems })
  }

  const addItem = () => {
    onChange({
      ...data,
      items: [...items, { quote: '', name: '' }],
    })
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onChange({ ...data, items: newItems })
  }

  return (
    <div className="space-y-4">
      <Input
        label="Section Title *"
        value={data.title || ''}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="What Our Customers Say"
        error={errors['title']}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Testimonials *
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={addItem}>
            + Add Testimonial
          </Button>
        </div>

        {items.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No testimonials added. Click "Add Testimonial" to get started.
          </p>
        )}

        {items.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Testimonial #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>

            <TextArea
              label="Quote *"
              value={item.quote || ''}
              onChange={(e) => updateItem(index, { quote: e.target.value })}
              placeholder="This product changed my life..."
              rows={3}
              error={errors[`items[${index}].quote`]}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Name *"
                value={item.name || ''}
                onChange={(e) => updateItem(index, { name: e.target.value })}
                placeholder="John Doe"
                error={errors[`items[${index}].name`]}
              />

              <Input
                label="Role"
                value={item.role || ''}
                onChange={(e) => updateItem(index, { role: e.target.value })}
                placeholder="CEO"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Company"
                value={item.company || ''}
                onChange={(e) => updateItem(index, { company: e.target.value })}
                placeholder="Acme Inc."
              />

              <ImageInput
                label="Avatar URL"
                value={item.avatarUrl || ''}
                onChange={(url) => updateItem(index, { avatarUrl: url })}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
