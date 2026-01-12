import { useState } from 'react'
import { Input, Button } from '../ui'
import { MediaPickerModal } from './MediaPickerModal'

interface ImageInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  error?: string
}

export function ImageInput({
  label,
  value,
  onChange,
  placeholder = 'https://... or /uploads/...',
  hint,
  error,
}: ImageInputProps) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            hint={hint}
            error={error}
          />
        </div>
        <div className="flex items-end pb-0.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowPicker(true)}
          >
            Browse
          </Button>
        </div>
      </div>

      {/* Preview */}
      {value && (
        <div className="relative w-24 h-24 rounded border border-gray-200 dark:border-slate-700 overflow-hidden bg-gray-50 dark:bg-slate-900">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}

      <MediaPickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={(url) => onChange(url)}
      />
    </div>
  )
}
