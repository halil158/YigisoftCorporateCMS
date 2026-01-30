import { useState } from 'react'
import { Section, SectionType, SectionData, SECTION_TYPES, createDefaultSectionData } from './types'
import { SectionCard } from './SectionCard'
import { Button, Select, ConfirmDialog } from '../ui'
import {
  HeroEditor,
  HeroInnerEditor,
  FeaturesEditor,
  CtaEditor,
  TestimonialsEditor,
  GalleryEditor,
  ContactFormEditor,
  ContentBlockEditor,
} from './editors'

interface SectionBuilderProps {
  sections: Section[]
  onChange: (sections: Section[]) => void
  errors?: Record<string, string>
}

export function SectionBuilder({ sections, onChange, errors = {} }: SectionBuilderProps) {
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(
    new Set(sections.map((_, i) => i))
  )
  const [newSectionType, setNewSectionType] = useState<SectionType>('hero')
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const toggleExpanded = (index: number) => {
    const next = new Set(expandedIndices)
    if (next.has(index)) {
      next.delete(index)
    } else {
      next.add(index)
    }
    setExpandedIndices(next)
  }

  const addSection = () => {
    const newSection: Section = {
      type: newSectionType,
      data: createDefaultSectionData(newSectionType),
    }
    const newSections = [...sections, newSection]
    onChange(newSections)
    // Expand the new section
    setExpandedIndices(new Set([...expandedIndices, newSections.length - 1]))
  }

  const updateSection = (index: number, data: SectionData) => {
    const newSections = [...sections]
    newSections[index] = { ...newSections[index], data }
    onChange(newSections)
  }

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= sections.length) return

    const newSections = [...sections]
    const [moved] = newSections.splice(index, 1)
    newSections.splice(newIndex, 0, moved)
    onChange(newSections)

    // Update expanded indices
    const next = new Set<number>()
    expandedIndices.forEach((i) => {
      if (i === index) {
        next.add(newIndex)
      } else if (i === newIndex) {
        next.add(index)
      } else {
        next.add(i)
      }
    })
    setExpandedIndices(next)
  }

  const confirmDelete = () => {
    if (deleteIndex === null) return
    const newSections = sections.filter((_, i) => i !== deleteIndex)
    onChange(newSections)
    setDeleteIndex(null)

    // Update expanded indices
    const next = new Set<number>()
    expandedIndices.forEach((i) => {
      if (i < deleteIndex) {
        next.add(i)
      } else if (i > deleteIndex) {
        next.add(i - 1)
      }
    })
    setExpandedIndices(next)
  }

  const renderEditor = (section: Section, index: number) => {
    const sectionErrors = extractSectionErrors(errors, index)

    switch (section.type) {
      case 'hero':
        return (
          <HeroEditor
            data={section.data as any}
            onChange={(data) => updateSection(index, data)}
            errors={sectionErrors}
          />
        )
      case 'hero-inner':
        return (
          <HeroInnerEditor
            data={section.data as any}
            onChange={(data) => updateSection(index, data)}
            errors={sectionErrors}
          />
        )
      case 'content-block':
        return (
          <ContentBlockEditor
            data={section.data as any}
            onChange={(data) => updateSection(index, data)}
            errors={sectionErrors}
          />
        )
      case 'features':
        return (
          <FeaturesEditor
            data={section.data as any}
            onChange={(data) => updateSection(index, data)}
            errors={sectionErrors}
          />
        )
      case 'cta':
        return (
          <CtaEditor
            data={section.data as any}
            onChange={(data) => updateSection(index, data)}
            errors={sectionErrors}
          />
        )
      case 'testimonials':
        return (
          <TestimonialsEditor
            data={section.data as any}
            onChange={(data) => updateSection(index, data)}
            errors={sectionErrors}
          />
        )
      case 'gallery':
        return (
          <GalleryEditor
            data={section.data as any}
            onChange={(data) => updateSection(index, data)}
            errors={sectionErrors}
          />
        )
      case 'contact-form':
        return (
          <ContactFormEditor
            data={section.data as any}
            onChange={(data) => updateSection(index, data)}
            errors={sectionErrors}
          />
        )
      default:
        return (
          <div className="text-gray-500 dark:text-gray-400 italic">
            Unknown section type: {section.type}
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Section list */}
      {sections.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            No sections yet. Add your first section below.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <SectionCard
              key={index}
              type={section.type}
              index={index}
              totalCount={sections.length}
              isExpanded={expandedIndices.has(index)}
              onToggle={() => toggleExpanded(index)}
              onMoveUp={() => moveSection(index, 'up')}
              onMoveDown={() => moveSection(index, 'down')}
              onDelete={() => setDeleteIndex(index)}
            >
              {renderEditor(section, index)}
            </SectionCard>
          ))}
        </div>
      )}

      {/* Add section */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
        <Select
          value={newSectionType}
          onChange={(e) => setNewSectionType(e.target.value as SectionType)}
          className="w-48"
        >
          {SECTION_TYPES.map((t) => (
            <option key={t.type} value={t.type}>
              {t.label}
            </option>
          ))}
        </Select>
        <Button type="button" onClick={addSection}>
          + Add Section
        </Button>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteIndex !== null}
        onClose={() => setDeleteIndex(null)}
        onConfirm={confirmDelete}
        title="Delete Section"
        message={`Are you sure you want to delete this ${
          deleteIndex !== null ? sections[deleteIndex]?.type : ''
        } section? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}

/**
 * Extract errors for a specific section from the flat error map.
 * Converts "sections[0].data.title" to "title" for the section at index 0.
 */
function extractSectionErrors(
  errors: Record<string, string>,
  sectionIndex: number
): Record<string, string> {
  const prefix = `sections[${sectionIndex}].data.`
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(errors)) {
    if (key.startsWith(prefix)) {
      const fieldPath = key.slice(prefix.length)
      result[fieldPath] = value
    }
  }

  return result
}
