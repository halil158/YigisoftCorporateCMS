import { useState, useEffect } from 'react'
import { fetchBranding, ResolvedBrandingSettings } from '../api/client'

// Default branding fallback
const DEFAULT_BRANDING: ResolvedBrandingSettings = {
  siteName: 'Yigisoft',
  logoLightUrl: null,
  logoDarkUrl: null,
  faviconUrl: null,
  appleTouchIconUrl: null,
  defaultOgImageUrl: null,
}

export function useBranding() {
  const [branding, setBranding] = useState<ResolvedBrandingSettings>(DEFAULT_BRANDING)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBranding()
        setBranding({
          siteName: data.siteName || DEFAULT_BRANDING.siteName,
          logoLightUrl: data.logoLightUrl,
          logoDarkUrl: data.logoDarkUrl,
          faviconUrl: data.faviconUrl,
          appleTouchIconUrl: data.appleTouchIconUrl,
          defaultOgImageUrl: data.defaultOgImageUrl,
        })
      } catch (err) {
        console.warn('Failed to load branding settings, using defaults:', err)
        setBranding(DEFAULT_BRANDING)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  return { branding, isLoading }
}
