import { Input } from '../../ui'
import { CtaData } from '../types'

interface CtaEditorProps {
  data: CtaData
  onChange: (data: CtaData) => void
  errors?: Record<string, string>
}

export function CtaEditor({ data, onChange, errors = {} }: CtaEditorProps) {
  const update = (partial: Partial<CtaData>) => {
    onChange({ ...data, ...partial })
  }

  return (
    <div className="space-y-4">
      <Input
        label="Title *"
        value={data.title || ''}
        onChange={(e) => update({ title: e.target.value })}
        placeholder="Ready to get started?"
        error={errors['title']}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Button Text *"
          value={data.buttonText || ''}
          onChange={(e) => update({ buttonText: e.target.value })}
          placeholder="Get Started"
          error={errors['buttonText']}
        />

        <Input
          label="Button URL *"
          value={data.buttonUrl || ''}
          onChange={(e) => update({ buttonUrl: e.target.value })}
          placeholder="/contact"
          error={errors['buttonUrl']}
        />
      </div>
    </div>
  )
}
