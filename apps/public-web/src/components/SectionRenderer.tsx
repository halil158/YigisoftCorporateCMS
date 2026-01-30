import type { Section, HeroData, HeroInnerData, FeaturesData, CtaData, GalleryData, ContactFormData, TestimonialsData, ContentBlockData } from '../types/sections'
import {
  HeroSection,
  HeroInnerSection,
  FeaturesSection,
  CtaSection,
  GallerySection,
  ContactFormSection,
  TestimonialsSection,
  ContentBlockSection,
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
    case 'hero-inner':
      return <HeroInnerSection data={section.data as HeroInnerData} />
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
    case 'content-block':
      return <ContentBlockSection data={section.data as ContentBlockData} />
    default:
      return <UnknownSection type={section.type} />
  }
}
