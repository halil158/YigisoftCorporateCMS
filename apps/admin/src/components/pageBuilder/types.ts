/**
 * Section types supported by the page builder.
 * Must match the backend SectionsValidator registry.
 */
export type SectionType =
  | 'hero'
  | 'features'
  | 'cta'
  | 'testimonials'
  | 'gallery'
  | 'contact-form'

/**
 * Section type metadata for UI display
 */
export interface SectionTypeMeta {
  type: SectionType
  label: string
  description: string
  icon: string
}

export const SECTION_TYPES: SectionTypeMeta[] = [
  { type: 'hero', label: 'Hero', description: 'Large header with title, subtitle, and CTA', icon: 'H' },
  { type: 'features', label: 'Features', description: 'List of features with icons', icon: 'F' },
  { type: 'cta', label: 'Call to Action', description: 'Prominent button with message', icon: 'C' },
  { type: 'testimonials', label: 'Testimonials', description: 'Customer quotes and reviews', icon: 'T' },
  { type: 'gallery', label: 'Gallery', description: 'Image gallery grid', icon: 'G' },
  { type: 'contact-form', label: 'Contact Form', description: 'Form to collect visitor messages', icon: '@' },
]

/**
 * Hero section data
 */
export interface HeroData {
  title: string
  subtitle?: string
  imageUrl?: string
  primaryCta?: {
    text?: string
    url?: string
  }
}

/**
 * Features section data
 */
export interface FeaturesData {
  title: string
  items: FeatureItem[]
}

export interface FeatureItem {
  title: string
  description?: string
  icon?: string
}

/**
 * CTA section data
 */
export interface CtaData {
  title: string
  buttonText: string
  buttonUrl: string
}

/**
 * Testimonials section data
 */
export interface TestimonialsData {
  title: string
  items: TestimonialItem[]
}

export interface TestimonialItem {
  quote: string
  name: string
  role?: string
  company?: string
  avatarUrl?: string
}

/**
 * Gallery section data
 */
export interface GalleryData {
  title: string
  items: GalleryItem[]
}

export interface GalleryItem {
  imageUrl: string
  alt?: string
  caption?: string
}

/**
 * Contact form section data
 */
export interface ContactFormData {
  title: string
  recipientEmail: string
  description?: string
  submitText?: string
  fields: ContactFormField[]
}

export interface ContactFormField {
  name: string
  label: string
  type: 'text' | 'email' | 'textarea' | 'phone'
  required?: boolean
  placeholder?: string
}

/**
 * Union of all section data types
 */
export type SectionData =
  | HeroData
  | FeaturesData
  | CtaData
  | TestimonialsData
  | GalleryData
  | ContactFormData

/**
 * A section in the page builder
 */
export interface Section {
  type: SectionType
  data: SectionData
}

/**
 * Create default data for a section type
 */
export function createDefaultSectionData(type: SectionType): SectionData {
  switch (type) {
    case 'hero':
      return { title: '' }
    case 'features':
      return { title: '', items: [{ title: '' }] }
    case 'cta':
      return { title: '', buttonText: '', buttonUrl: '' }
    case 'testimonials':
      return { title: '', items: [{ quote: '', name: '' }] }
    case 'gallery':
      return { title: '', items: [{ imageUrl: '' }] }
    case 'contact-form':
      return {
        title: '',
        recipientEmail: '',
        fields: [{ name: 'email', label: 'Email', type: 'email' }],
      }
  }
}
