import type { Section, HeroData, FeaturesData, CtaData, GalleryData, ContactFormData, TestimonialsData } from '../types/sections'
import {
  HeroSection,
  FeaturesSection,
  CtaSection,
  GallerySection,
  ContactFormSection,
  TestimonialsSection,
  UnknownSection,
} from './sections'

interface Props {
  sections: Section[]
}

export function SectionRenderer({ sections }: Props) {
  return (
    <>
      {sections.map((section, index) => (
        <SectionSwitch key={index} section={section} />
      ))}
    </>
  )
}

function SectionSwitch({ section }: { section: Section }) {
  switch (section.type) {
    case 'hero':
      return <HeroSection data={section.data as HeroData} />
    case 'features':
      return <FeaturesSection data={section.data as FeaturesData} />
    case 'cta':
      return <CtaSection data={section.data as CtaData} />
    case 'gallery':
      return <GallerySection data={section.data as GalleryData} />
    case 'contact-form':
      return <ContactFormSection data={section.data as ContactFormData} />
    case 'testimonials':
      return <TestimonialsSection data={section.data as TestimonialsData} />
    default:
      return <UnknownSection type={section.type} />
  }
}
