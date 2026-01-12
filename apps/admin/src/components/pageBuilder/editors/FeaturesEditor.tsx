import { Input, TextArea, Button } from '../../ui'
import { FeaturesData, FeatureItem } from '../types'

interface FeaturesEditorProps {
  data: FeaturesData
  onChange: (data: FeaturesData) => void
  errors?: Record<string, string>
}

export function FeaturesEditor({ data, onChange, errors = {} }: FeaturesEditorProps) {
  const items = data.items || []

  const updateItem = (index: number, partial: Partial<FeatureItem>) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], ...partial }
    onChange({ ...data, items: newItems })
  }

  const addItem = () => {
    onChange({
      ...data,
      items: [...items, { title: '' }],
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
        placeholder="Our Features"
        error={errors['title']}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Features *
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={addItem}>
            + Add Feature
          </Button>
        </div>

        {items.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No features added. Click "Add Feature" to get started.
          </p>
        )}

        {items.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Feature #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>

            <Input
              label="Title *"
              value={item.title || ''}
              onChange={(e) => updateItem(index, { title: e.target.value })}
              placeholder="Feature title"
              error={errors[`items[${index}].title`]}
            />

            <TextArea
              label="Description"
              value={item.description || ''}
              onChange={(e) => updateItem(index, { description: e.target.value })}
              placeholder="Brief description of this feature"
              rows={2}
            />

            <Input
              label="Icon Name"
              value={item.icon || ''}
              onChange={(e) => updateItem(index, { icon: e.target.value })}
              placeholder="e.g., star, heart, check"
              hint="Icon identifier for your frontend"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
