import { useState, useEffect } from 'react'
import { fetchTheme, ThemeTokens } from '../api/client'

// Default theme tokens (should match admin defaults and index.css fallbacks)
const DEFAULT_TOKENS: Required<ThemeTokens> = {
  primary: '#dc2626',
  primaryContrast: '#ffffff',
  accent: '#b91c1c',
  background: '#ffffff',
  surface: '#f6f7f9',
  text: '#0f172a',
  mutedText: '#475569',
  border: '#e2e8f0',
}

export function useTheme() {
  const [tokens, setTokens] = useState<Required<ThemeTokens>>(DEFAULT_TOKENS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTheme()
        setTokens({
          primary: data.tokens?.primary || DEFAULT_TOKENS.primary,
          primaryContrast: data.tokens?.primaryContrast || DEFAULT_TOKENS.primaryContrast,
          accent: data.tokens?.accent || DEFAULT_TOKENS.accent,
          background: data.tokens?.background || DEFAULT_TOKENS.background,
          surface: data.tokens?.surface || DEFAULT_TOKENS.surface,
          text: data.tokens?.text || DEFAULT_TOKENS.text,
          mutedText: data.tokens?.mutedText || DEFAULT_TOKENS.mutedText,
          border: data.tokens?.border || DEFAULT_TOKENS.border,
        })
      } catch (err) {
        console.warn('Failed to load theme settings, using defaults:', err)
        setTokens(DEFAULT_TOKENS)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  return { tokens, isLoading }
}
