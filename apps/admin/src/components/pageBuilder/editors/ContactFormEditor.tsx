import { Input, TextArea, Select, Button } from '../../ui'
import { ContactFormData, ContactFormField } from '../types'

interface ContactFormEditorProps {
  data: ContactFormData
  onChange: (data: ContactFormData) => void
  errors?: Record<string, string>
}

const FIELD_TYPES: { value: ContactFormField['type']; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'textarea', label: 'Text Area' },
]

export function ContactFormEditor({ data, onChange, errors = {} }: ContactFormEditorProps) {
  const fields = data.fields || []

  const updateField = (index: number, partial: Partial<ContactFormField>) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], ...partial }
    onChange({ ...data, fields: newFields })
  }

  const addField = () => {
    const fieldNum = fields.length + 1
    onChange({
      ...data,
      fields: [
        ...fields,
        { name: `field${fieldNum}`, label: `Field ${fieldNum}`, type: 'text' },
      ],
    })
  }

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index)
    onChange({ ...data, fields: newFields })
  }

  return (
    <div className="space-y-4">
      <Input
        label="Form Title *"
        value={data.title || ''}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Contact Us"
        error={errors['title']}
      />

      <Input
        label="Recipient Email *"
        value={data.recipientEmail || ''}
        onChange={(e) => onChange({ ...data, recipientEmail: e.target.value })}
        placeholder="contact@example.com"
        hint="Form submissions will be sent to this address"
        error={errors['recipientEmail']}
      />

      <TextArea
        label="Description"
        value={data.description || ''}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
        placeholder="Fill out the form below and we'll get back to you..."
        rows={2}
      />

      <Input
        label="Submit Button Text"
        value={data.submitText || ''}
        onChange={(e) => onChange({ ...data, submitText: e.target.value })}
        placeholder="Send Message"
      />

      <div className="border-t border-gray-200 dark:border-slate-700 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Form Fields *
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={addField}>
            + Add Field
          </Button>
        </div>

        {fields.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No fields added. Click "Add Field" to create form fields.
          </p>
        )}

        {fields.map((field, index) => (
          <div
            key={index}
            className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Field #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeField(index)}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Field Name *"
                value={field.name || ''}
                onChange={(e) => updateField(index, { name: e.target.value })}
                placeholder="email"
                hint="Unique identifier"
                error={errors[`fields[${index}].name`]}
              />

              <Input
                label="Label *"
                value={field.label || ''}
                onChange={(e) => updateField(index, { label: e.target.value })}
                placeholder="Email Address"
                error={errors[`fields[${index}].label`]}
              />

              <Select
                label="Type *"
                value={field.type || 'text'}
                onChange={(e) =>
                  updateField(index, { type: e.target.value as ContactFormField['type'] })
                }
                error={errors[`fields[${index}].type`]}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Placeholder"
                value={field.placeholder || ''}
                onChange={(e) => updateField(index, { placeholder: e.target.value })}
                placeholder="Enter your email..."
              />

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required || false}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Required</span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
