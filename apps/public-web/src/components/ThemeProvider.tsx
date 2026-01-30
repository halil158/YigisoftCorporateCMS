import { useEffect, type ReactNode } from 'react'
import { useTheme } from '../hooks/useTheme'

interface Props {
  children: ReactNode
}

/**
 * Converts a hex color to HSL values.
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace(/^#/, '')

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

/**
 * Converts HSL values to a hex color.
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0
  let g = 0
  let b = 0

  if (h < 60) {
    r = c
    g = x
  } else if (h < 120) {
    r = x
    g = c
  } else if (h < 180) {
    g = c
    b = x
  } else if (h < 240) {
    g = x
    b = c
  } else if (h < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Generates a color palette from a base color.
 * Returns colors for 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 shades.
 */
function generateColorPalette(baseColor: string): Record<string, string> {
  const { h, s } = hexToHsl(baseColor)

  // Lightness values for each shade (50 is lightest, 900 is darkest)
  const shades: Record<string, number> = {
    '50': 97,
    '100': 94,
    '200': 86,
    '300': 74,
    '400': 60,
    '500': 50,
    '600': 45,
    '700': 38,
    '800': 30,
    '900': 24,
  }

  // Saturation adjustments (lighter shades are less saturated)
  const saturationAdjust: Record<string, number> = {
    '50': 0.4,
    '100': 0.5,
    '200': 0.6,
    '300': 0.7,
    '400': 0.85,
    '500': 1,
    '600': 1,
    '700': 0.95,
    '800': 0.9,
    '900': 0.85,
  }

  const palette: Record<string, string> = {}

  for (const [shade, lightness] of Object.entries(shades)) {
    const adjustedSaturation = s * saturationAdjust[shade]
    palette[shade] = hslToHex(h, adjustedSaturation, lightness)
  }

  return palette
}

/**
 * Darkens a color by a percentage for hover/active states.
 */
function darkenColor(hex: string, percent: number): string {
  const { h, s, l } = hexToHsl(hex)
  const newL = Math.max(0, l * (1 - percent / 100))
  return hslToHex(h, s, newL)
}

// Default fallback colors (should match useTheme.ts and index.css defaults)
const DEFAULT_PRIMARY = '#dc2626'

export function ThemeProvider({ children }: Props) {
  const { tokens } = useTheme()

  useEffect(() => {
    const root = document.documentElement

    // Ensure we have valid color strings (fallback to defaults if null)
    const primary = tokens.primary || DEFAULT_PRIMARY
    const primaryContrast = tokens.primaryContrast || '#ffffff'
    const accent = tokens.accent || '#b91c1c'
    const background = tokens.background || '#ffffff'
    const surface = tokens.surface || '#f6f7f9'
    const text = tokens.text || '#0f172a'
    const mutedText = tokens.mutedText || '#475569'
    const border = tokens.border || '#e2e8f0'

    // Set base theme colors
    root.style.setProperty('--color-primary', primary)
    root.style.setProperty('--color-primary-contrast', primaryContrast)
    root.style.setProperty('--color-accent', accent)
    root.style.setProperty('--color-bg', background)
    root.style.setProperty('--color-surface', surface)
    root.style.setProperty('--color-text', text)
    root.style.setProperty('--color-muted-text', mutedText)
    root.style.setProperty('--color-border', border)

    // Generate and set derived primary color palette
    const palette = generateColorPalette(primary)
    for (const [shade, color] of Object.entries(palette)) {
      root.style.setProperty(`--color-primary-${shade}`, color)
    }

    // Set the 600 shade to match the exact primary color for consistency
    root.style.setProperty('--color-primary-600', primary)

    // Set soft/muted variants
    root.style.setProperty('--color-primary-soft', palette['50'])
    root.style.setProperty('--color-accent-soft', palette['100'])

    // Set button hover/active states (darken primary by 12% and 22%)
    root.style.setProperty('--color-primary-hover', darkenColor(primary, 12))
    root.style.setProperty('--color-primary-active', darkenColor(primary, 22))

  }, [tokens])

  return <>{children}</>
}
