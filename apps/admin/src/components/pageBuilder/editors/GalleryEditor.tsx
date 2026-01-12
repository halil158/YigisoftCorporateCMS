import { Input, Button } from '../../ui'
import { ImageInput } from '../ImageInput'
import { GalleryData, GalleryItem } from '../types'

interface GalleryEditorProps {
  data: GalleryData
  onChange: (data: GalleryData) => void
  errors?: Record<string, string>
}

export function GalleryEditor({ data, onChange, errors = {} }: GalleryEditorProps) {
  const items = data.items || []

  const updateItem = (index: number, partial: Partial<GalleryItem>) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], ...partial }
    onChange({ ...data, items: newItems })
  }

  const addItem = () => {
    onChange({
      ...data,
      items: [...items, { imageUrl: '' }],
    })
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onChange({ ...data, items: newItems })
  }

  return (
    <div className="space-y-4">
      <Input
        label="Gallery Title *"
        value={data.title || ''}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Our Work"
        error={errors['title']}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Images *
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={addItem}>
            + Add Image
          </Button>
        </div>

        {items.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No images added. Click "Add Image" to get started.
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Image #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>

              <ImageInput
                label="Image URL *"
                value={item.imageUrl || ''}
                onChange={(url) => updateItem(index, { imageUrl: url })}
                error={errors[`items[${index}].imageUrl`]}
              />

              <Input
                label="Alt Text"
                value={item.alt || ''}
                onChange={(e) => updateItem(index, { alt: e.target.value })}
                placeholder="Description of the image"
              />

              <Input
                label="Caption"
                value={item.caption || ''}
                onChange={(e) => updateItem(index, { caption: e.target.value })}
                placeholder="Optional caption"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
