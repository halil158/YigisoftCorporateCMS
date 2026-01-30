import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import type { ContactFormData } from '../../types/sections'
import { submitContactForm, ContactSubmissionError } from '../../api/client'

interface Props {
  data: ContactFormData
}

export function ContactFormSection({ data }: Props) {
  const { slug } = useParams<{ slug: string }>()
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!slug) return

    setStatus('submitting')
    setErrorMessage('')

    try {
      await submitContactForm(slug, formData)
      setStatus('success')
      setFormData({})
    } catch (err) {
      setStatus('error')
      if (err instanceof ContactSubmissionError) {
        setErrorMessage(err.details?.join(', ') || err.message)
      } else {
        setErrorMessage('Failed to submit form. Please try again.')
      }
    }
  }

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <section className="py-16 bg-gray-50 sm:py-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {data.title}
          </h2>
          {data.description && (
            <p className="mt-4 text-lg text-gray-600">{data.description}</p>
          )}
        </div>

        {status === 'success' ? (
          <div className="mt-10 success-card">
            <div className="icon-bubble mx-auto mb-4">
              ✓
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-primary-700)' }}>Message Sent!</h3>
            <p className="mt-2" style={{ color: 'var(--color-primary-600)' }}>Thank you for reaching out. We'll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            {data.fields.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium text-gray-700"
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    required={field.required}
                    placeholder={field.placeholder}
                    rows={4}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                ) : (
                  <input
                    type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                    id={field.name}
                    name={field.name}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                )}
              </div>
            ))}

            {status === 'error' && errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full rounded-lg bg-primary-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? 'Sending...' : data.submitText || 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
