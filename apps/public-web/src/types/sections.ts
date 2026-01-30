/**
 * Section types supported by the CMS.
 * Must match the backend SectionsValidator registry.
 */
export type SectionType =
  | 'hero'
  | 'hero-inner'
  | 'features'
  | 'cta'
  | 'testimonials'
  | 'gallery'
  | 'contact-form'
  | 'content-block'

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
 * Hero inner section data (for inner pages with breadcrumb support)
 */
export interface HeroInnerData {
  title: string
  subtitle?: string
  backgroundImageUrl?: string
  overlayOpacity?: number
  breadcrumbs?: BreadcrumbItem[]
}

export interface BreadcrumbItem {
  text: string
  url?: string
}

/**
 * Content block section data
 */
export interface ContentBlockData {
  title: string
  subtitle?: string
  content?: string
  imageUrl?: string
  layout?: 'text-left' | 'text-right' | 'text-center'
  variant?: 'default' | 'highlight' | 'muted'
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
 * A section in the page
 */
export interface Section {
  type: SectionType
  data: HeroData | HeroInnerData | FeaturesData | CtaData | TestimonialsData | GalleryData | ContactFormData | ContentBlockData
}
