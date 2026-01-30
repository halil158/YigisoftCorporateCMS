import { useEffect, type ReactNode } from 'react'
import { useTheme } from '../hooks/useTheme'

interface Props {
  children: ReactNode
}

export function ThemeProvider({ children }: Props) {
  const { tokens } = useTheme()

  useEffect(() => {
    // Inject CSS variables into :root
    const root = document.documentElement

    root.style.setProperty('--color-primary', tokens.primary)
    root.style.setProperty('--color-primary-contrast', tokens.primaryContrast)
    root.style.setProperty('--color-accent', tokens.accent)
    root.style.setProperty('--color-bg', tokens.background)
    root.style.setProperty('--color-surface', tokens.surface)
    root.style.setProperty('--color-text', tokens.text)
    root.style.setProperty('--color-muted-text', tokens.mutedText)
    root.style.setProperty('--color-border', tokens.border)
  }, [tokens])

  return <>{children}</>
}
