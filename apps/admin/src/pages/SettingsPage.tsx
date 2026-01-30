import { useState, useEffect } from 'react'
import { AdminLayout } from '../components/AdminLayout'
import { Button, Card, Input } from '../components/ui'
import { useToast } from '../components/ui'
import { settingsApi, uploadsApi, UploadItem, BrandingSettings, ThemeSettings, ThemeTokens } from '../api/client'
import { MediaPickerModalWithId } from '../components/settings/MediaPickerModalWithId'

type TabType = 'branding' | 'theme'

// Default theme tokens
const DEFAULT_THEME_TOKENS: ThemeTokens = {
  primary: '#22c55e',
  primaryContrast: '#ffffff',
  accent: '#16a34a',
  background: '#ffffff',
  surface: '#f6f7f9',
  text: '#0f172a',
  mutedText: '#475569',
  border: '#e2e8f0',
}

export function SettingsPage() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('branding')

  // Branding state
  const [branding, setBranding] = useState<BrandingSettings>({})
  const [brandingLoading, setBrandingLoading] = useState(true)
  const [brandingSaving, setBrandingSaving] = useState(false)

  // Theme state
  const [theme, setTheme] = useState<ThemeSettings>({ mode: 'single', tokens: { ...DEFAULT_THEME_TOKENS } })
  const [themeLoading, setThemeLoading] = useState(true)
  const [themeSaving, setThemeSaving] = useState(false)

  // Media for previews
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [mediaPickerField, setMediaPickerField] = useState<keyof BrandingSettings | null>(null)

  // Load settings
  useEffect(() => {
    loadBranding()
    loadTheme()
    loadUploads()
  }, [])

  const loadBranding = async () => {
    setBrandingLoading(true)
    try {
      const data = await settingsApi.get('site.branding')
      setBranding(data.data as BrandingSettings)
    } catch {
      // Use empty object if not found
      setBranding({})
    } finally {
      setBrandingLoading(false)
    }
  }

  const loadTheme = async () => {
    setThemeLoading(true)
    try {
      const data = await settingsApi.get('site.theme')
      const themeData = data.data as unknown as ThemeSettings
      setTheme({
        mode: themeData?.mode || 'single',
        tokens: { ...DEFAULT_THEME_TOKENS, ...(themeData?.tokens || {}) },
      })
    } catch {
      setTheme({ mode: 'single', tokens: { ...DEFAULT_THEME_TOKENS } })
    } finally {
      setThemeLoading(false)
    }
  }

  const loadUploads = async () => {
    try {
      const data = await uploadsApi.list(200)
      setUploads(data)
    } catch {
      // Ignore
    }
  }

  const saveBranding = async () => {
    setBrandingSaving(true)
    try {
      await settingsApi.update('site.branding', branding as Record<string, unknown>)
      toast.success('Branding settings saved')
    } catch (err: unknown) {
      const error = err as { details?: string[] }
      toast.error(error.details?.join(', ') || 'Failed to save branding settings')
    } finally {
      setBrandingSaving(false)
    }
  }

  const saveTheme = async () => {
    setThemeSaving(true)
    try {
      await settingsApi.update('site.theme', theme as unknown as Record<string, unknown>)
      toast.success('Theme settings saved')
    } catch (err: unknown) {
      const error = err as { details?: string[] }
      toast.error(error.details?.join(', ') || 'Failed to save theme settings')
    } finally {
      setThemeSaving(false)
    }
  }

  const resetTheme = () => {
    setTheme({ mode: 'single', tokens: { ...DEFAULT_THEME_TOKENS } })
    toast.info('Theme reset to defaults (not saved yet)')
  }

  const getMediaUrl = (mediaId: string | null | undefined): string | null => {
    if (!mediaId) return null
    const upload = uploads.find((u) => u.id === mediaId)
    return upload?.thumbnailUrl || upload?.url || null
  }

  const handleMediaSelect = (id: string | null) => {
    if (mediaPickerField) {
      setBranding((prev) => ({ ...prev, [mediaPickerField]: id }))
    }
    setMediaPickerField(null)
  }

  const updateThemeToken = (key: keyof ThemeTokens, value: string) => {
    setTheme((prev) => ({
      ...prev,
      tokens: { ...prev.tokens, [key]: value || null },
    }))
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'branding', label: 'Branding' },
    { key: 'theme', label: 'Theme' },
  ]

  return (
    <AdminLayout title="Settings">
      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure site branding and theme colors
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-slate-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-1 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.key
                  ? 'border-primary-500 text-primary-600 dark:border-accent-soft dark:text-accent-soft'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <Card>
          {brandingLoading ? (
            <div className="py-12 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-6">
              {/* Site Name */}
              <div>
                <Input
                  label="Site Name"
                  value={branding.siteName || ''}
                  onChange={(e) => setBranding((prev) => ({ ...prev, siteName: e.target.value || null }))}
                  placeholder="My Website"
                />
              </div>

              {/* Logo Light */}
              <MediaField
                label="Logo (Light)"
                hint="Recommended: 200x60px, PNG/SVG"
                mediaId={branding.logoLight}
                previewUrl={getMediaUrl(branding.logoLight)}
                onPick={() => setMediaPickerField('logoLight')}
                onClear={() => setBranding((prev) => ({ ...prev, logoLight: null }))}
              />

              {/* Logo Dark */}
              <MediaField
                label="Logo (Dark)"
                hint="Optional, for dark mode. Same size as light logo."
                mediaId={branding.logoDark}
                previewUrl={getMediaUrl(branding.logoDark)}
                onPick={() => setMediaPickerField('logoDark')}
                onClear={() => setBranding((prev) => ({ ...prev, logoDark: null }))}
              />

              {/* Favicon */}
              <MediaField
                label="Favicon"
                hint="Recommended: 32x32px, PNG/ICO"
                mediaId={branding.favicon}
                previewUrl={getMediaUrl(branding.favicon)}
                onPick={() => setMediaPickerField('favicon')}
                onClear={() => setBranding((prev) => ({ ...prev, favicon: null }))}
              />

              {/* Apple Touch Icon */}
              <MediaField
                label="Apple Touch Icon"
                hint="Recommended: 180x180px, PNG"
                mediaId={branding.appleTouchIcon}
                previewUrl={getMediaUrl(branding.appleTouchIcon)}
                onPick={() => setMediaPickerField('appleTouchIcon')}
                onClear={() => setBranding((prev) => ({ ...prev, appleTouchIcon: null }))}
              />

              {/* Default OG Image */}
              <MediaField
                label="Default OG Image"
                hint="Recommended: 1200x630px. Used for social sharing when pages don't have custom images."
                mediaId={branding.defaultOgImage}
                previewUrl={getMediaUrl(branding.defaultOgImage)}
                onPick={() => setMediaPickerField('defaultOgImage')}
                onClear={() => setBranding((prev) => ({ ...prev, defaultOgImage: null }))}
              />

              {/* Save Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <Button onClick={saveBranding} disabled={brandingSaving}>
                  {brandingSaving ? 'Saving...' : 'Save Branding'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Theme Tab */}
      {activeTab === 'theme' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Color Inputs */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Color Tokens</h3>
            {themeLoading ? (
              <div className="py-12 text-center text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-4">
                <ColorField
                  label="Primary"
                  value={theme.tokens?.primary || ''}
                  onChange={(v) => updateThemeToken('primary', v)}
                />
                <ColorField
                  label="Primary Contrast"
                  value={theme.tokens?.primaryContrast || ''}
                  onChange={(v) => updateThemeToken('primaryContrast', v)}
                />
                <ColorField
                  label="Accent"
                  value={theme.tokens?.accent || ''}
                  onChange={(v) => updateThemeToken('accent', v)}
                />
                <ColorField
                  label="Background"
                  value={theme.tokens?.background || ''}
                  onChange={(v) => updateThemeToken('background', v)}
                />
                <ColorField
                  label="Surface"
                  value={theme.tokens?.surface || ''}
                  onChange={(v) => updateThemeToken('surface', v)}
                />
                <ColorField
                  label="Text"
                  value={theme.tokens?.text || ''}
                  onChange={(v) => updateThemeToken('text', v)}
                />
                <ColorField
                  label="Muted Text"
                  value={theme.tokens?.mutedText || ''}
                  onChange={(v) => updateThemeToken('mutedText', v)}
                />
                <ColorField
                  label="Border"
                  value={theme.tokens?.border || ''}
                  onChange={(v) => updateThemeToken('border', v)}
                />

                <div className="pt-4 border-t border-gray-200 dark:border-slate-700 flex gap-3">
                  <Button onClick={saveTheme} disabled={themeSaving}>
                    {themeSaving ? 'Saving...' : 'Save Theme'}
                  </Button>
                  <Button variant="secondary" onClick={resetTheme}>
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Live Preview */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Live Preview</h3>
            <ThemePreview tokens={theme.tokens || {}} />
          </Card>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModalWithId
        isOpen={mediaPickerField !== null}
        onClose={() => setMediaPickerField(null)}
        onSelect={handleMediaSelect}
        title={`Select ${mediaPickerField ? mediaPickerField.replace(/([A-Z])/g, ' $1').trim() : 'Image'}`}
      />
    </AdminLayout>
  )
}

// Media field component
interface MediaFieldProps {
  label: string
  hint: string
  mediaId: string | null | undefined
  previewUrl: string | null
  onPick: () => void
  onClear: () => void
}

function MediaField({ label, hint, mediaId, previewUrl, onPick, onClear }: MediaFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{hint}</p>
      <div className="flex items-center gap-3">
        {previewUrl ? (
          <div className="relative w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
            <img src={previewUrl} alt="" className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
            <span className="text-xs text-gray-400">No image</span>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button variant="secondary" size="sm" onClick={onPick}>
            {mediaId ? 'Change' : 'Select'}
          </Button>
          {mediaId && (
            <Button variant="ghost" size="sm" onClick={onClear} className="text-red-500">
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Color field component
interface ColorFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-slate-600"
      />
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="mt-1"
        />
      </div>
    </div>
  )
}

// Theme preview component
interface ThemePreviewProps {
  tokens: ThemeTokens
}

function ThemePreview({ tokens }: ThemePreviewProps) {
  const style = {
    '--preview-primary': tokens.primary || DEFAULT_THEME_TOKENS.primary,
    '--preview-primary-contrast': tokens.primaryContrast || DEFAULT_THEME_TOKENS.primaryContrast,
    '--preview-accent': tokens.accent || DEFAULT_THEME_TOKENS.accent,
    '--preview-bg': tokens.background || DEFAULT_THEME_TOKENS.background,
    '--preview-surface': tokens.surface || DEFAULT_THEME_TOKENS.surface,
    '--preview-text': tokens.text || DEFAULT_THEME_TOKENS.text,
    '--preview-muted': tokens.mutedText || DEFAULT_THEME_TOKENS.mutedText,
    '--preview-border': tokens.border || DEFAULT_THEME_TOKENS.border,
  } as React.CSSProperties

  return (
    <div
      style={style}
      className="p-6 rounded-lg border"
    >
      <div
        style={{ backgroundColor: 'var(--preview-bg)' }}
        className="p-4 rounded-lg"
      >
        {/* Button preview */}
        <div className="mb-4">
          <span className="text-sm font-medium" style={{ color: 'var(--preview-muted)' }}>
            Button:
          </span>
          <div className="mt-2">
            <button
              style={{
                backgroundColor: 'var(--preview-primary)',
                color: 'var(--preview-primary-contrast)',
              }}
              className="px-4 py-2 rounded-lg font-medium"
            >
              Primary Button
            </button>
          </div>
        </div>

        {/* Card preview */}
        <div className="mb-4">
          <span className="text-sm font-medium" style={{ color: 'var(--preview-muted)' }}>
            Card:
          </span>
          <div
            style={{
              backgroundColor: 'var(--preview-surface)',
              borderColor: 'var(--preview-border)',
            }}
            className="mt-2 p-4 rounded-lg border"
          >
            <h4 style={{ color: 'var(--preview-text)' }} className="font-semibold">
              Card Title
            </h4>
            <p style={{ color: 'var(--preview-muted)' }} className="text-sm mt-1">
              This is some muted text in a card.
            </p>
          </div>
        </div>

        {/* Text preview */}
        <div>
          <span className="text-sm font-medium" style={{ color: 'var(--preview-muted)' }}>
            Text:
          </span>
          <div className="mt-2">
            <p style={{ color: 'var(--preview-text)' }}>
              Normal text color
            </p>
            <p style={{ color: 'var(--preview-muted)' }} className="text-sm">
              Muted text color
            </p>
            <a style={{ color: 'var(--preview-accent)' }} className="text-sm underline">
              Accent link color
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
