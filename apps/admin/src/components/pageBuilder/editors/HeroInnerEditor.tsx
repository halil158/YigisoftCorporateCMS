import { Input, Button } from '../../ui'
import { ImageInput } from '../ImageInput'
import { HeroInnerData, BreadcrumbItem } from '../types'

interface HeroInnerEditorProps {
  data: HeroInnerData
  onChange: (data: HeroInnerData) => void
  errors?: Record<string, string>
}

export function HeroInnerEditor({ data, onChange, errors = {} }: HeroInnerEditorProps) {
  const update = (partial: Partial<HeroInnerData>) => {
    onChange({ ...data, ...partial })
  }

  const updateBreadcrumb = (index: number, partial: Partial<BreadcrumbItem>) => {
    const newBreadcrumbs = [...(data.breadcrumbs || [])]
    newBreadcrumbs[index] = { ...newBreadcrumbs[index], ...partial }
    update({ breadcrumbs: newBreadcrumbs })
  }

  const addBreadcrumb = () => {
    const newBreadcrumbs = [...(data.breadcrumbs || []), { text: '' }]
    update({ breadcrumbs: newBreadcrumbs })
  }

  const removeBreadcrumb = (index: number) => {
    const newBreadcrumbs = (data.breadcrumbs || []).filter((_, i) => i !== index)
    update({ breadcrumbs: newBreadcrumbs })
  }

  return (
    <div className="space-y-4">
      <Input
        label="Title *"
        value={data.title || ''}
        onChange={(e) => update({ title: e.target.value })}
        placeholder="Page Title"
        error={errors['title']}
      />

      <Input
        label="Subtitle"
        value={data.subtitle || ''}
        onChange={(e) => update({ subtitle: e.target.value })}
        placeholder="Optional subtitle or description"
      />

      <ImageInput
        label="Background Image URL"
        value={data.backgroundImageUrl || ''}
        onChange={(url) => update({ backgroundImageUrl: url })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Overlay Opacity (0-100)
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={data.overlayOpacity ?? 50}
          onChange={(e) => update({ overlayOpacity: parseInt(e.target.value, 10) })}
          className="w-full"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {data.overlayOpacity ?? 50}%
        </span>
      </div>

      {/* Breadcrumbs */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Breadcrumbs
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={addBreadcrumb}>
            + Add
          </Button>
        </div>

        {(data.breadcrumbs || []).length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No breadcrumbs. Add one to show navigation path.
          </p>
        ) : (
          <div className="space-y-2">
            {(data.breadcrumbs || []).map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={crumb.text || ''}
                  onChange={(e) => updateBreadcrumb(index, { text: e.target.value })}
                  placeholder="Text"
                  className="flex-1"
                  error={errors[`breadcrumbs[${index}].text`]}
                />
                <Input
                  value={crumb.url || ''}
                  onChange={(e) => updateBreadcrumb(index, { url: e.target.value })}
                  placeholder="URL (optional)"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBreadcrumb(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  x
                </Button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          The last breadcrumb (current page) typically has no URL.
        </p>
      </div>
    </div>
  )
}
