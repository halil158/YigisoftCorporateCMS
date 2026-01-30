import { Input, TextArea, Select } from '../../ui'
import { ImageInput } from '../ImageInput'
import { ContentBlockData } from '../types'

interface ContentBlockEditorProps {
  data: ContentBlockData
  onChange: (data: ContentBlockData) => void
  errors?: Record<string, string>
}

export function ContentBlockEditor({ data, onChange, errors = {} }: ContentBlockEditorProps) {
  const update = (partial: Partial<ContentBlockData>) => {
    onChange({ ...data, ...partial })
  }

  return (
    <div className="space-y-4">
      <Input
        label="Title *"
        value={data.title || ''}
        onChange={(e) => update({ title: e.target.value })}
        placeholder="Section Title"
        error={errors['title']}
      />

      <Input
        label="Subtitle"
        value={data.subtitle || ''}
        onChange={(e) => update({ subtitle: e.target.value })}
        placeholder="Optional subtitle"
      />

      <TextArea
        label="Content"
        value={data.content || ''}
        onChange={(e) => update({ content: e.target.value })}
        placeholder="Main content text (HTML supported)"
        rows={6}
      />

      <ImageInput
        label="Image URL"
        value={data.imageUrl || ''}
        onChange={(url) => update({ imageUrl: url })}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Layout
          </label>
          <Select
            value={data.layout || 'text-left'}
            onChange={(e) => update({ layout: e.target.value as ContentBlockData['layout'] })}
          >
            <option value="text-left">Text Left, Image Right</option>
            <option value="text-right">Text Right, Image Left</option>
            <option value="text-center">Text Center (Image Above)</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Variant
          </label>
          <Select
            value={data.variant || 'default'}
            onChange={(e) => update({ variant: e.target.value as ContentBlockData['variant'] })}
          >
            <option value="default">Default</option>
            <option value="highlight">Highlight (Colored Background)</option>
            <option value="muted">Muted (Gray Background)</option>
          </Select>
        </div>
      </div>
    </div>
  )
}
