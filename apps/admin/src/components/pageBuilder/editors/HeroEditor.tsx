import { Input, TextArea } from '../../ui'
import { ImageInput } from '../ImageInput'
import { HeroData } from '../types'

interface HeroEditorProps {
  data: HeroData
  onChange: (data: HeroData) => void
  errors?: Record<string, string>
}

export function HeroEditor({ data, onChange, errors = {} }: HeroEditorProps) {
  const update = (partial: Partial<HeroData>) => {
    onChange({ ...data, ...partial })
  }

  const updateCta = (partial: Partial<NonNullable<HeroData['primaryCta']>>) => {
    onChange({
      ...data,
      primaryCta: { ...data.primaryCta, ...partial },
    })
  }

  return (
    <div className="space-y-4">
      <Input
        label="Title *"
        value={data.title || ''}
        onChange={(e) => update({ title: e.target.value })}
        placeholder="Welcome to Our Site"
        error={errors['title']}
      />

      <TextArea
        label="Subtitle"
        value={data.subtitle || ''}
        onChange={(e) => update({ subtitle: e.target.value })}
        placeholder="A compelling tagline for your hero section"
        rows={2}
      />

      <ImageInput
        label="Background Image URL"
        value={data.imageUrl || ''}
        onChange={(url) => update({ imageUrl: url })}
      />

      <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Primary Button (optional)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Button Text"
            value={data.primaryCta?.text || ''}
            onChange={(e) => updateCta({ text: e.target.value })}
            placeholder="Get Started"
          />
          <Input
            label="Button URL"
            value={data.primaryCta?.url || ''}
            onChange={(e) => updateCta({ url: e.target.value })}
            placeholder="/contact"
          />
        </div>
      </div>
    </div>
  )
}
