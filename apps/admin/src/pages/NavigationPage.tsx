import { useState, useEffect } from 'react'
import { pagesApi, navigationApi, type NavigationItem, type PageListItem } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { ApiErrorDisplay } from '../components/ApiErrorDisplay'
import { Button, Input, Select, Card, useToast, extractErrorMessage } from '../components/ui'

const NAVIGATION_KEY = 'main'

export function NavigationPage() {
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const [items, setItems] = useState<NavigationItem[]>([])
  const [pages, setPages] = useState<PageListItem[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [navData, pagesData] = await Promise.all([
        navigationApi.get(NAVIGATION_KEY),
        pagesApi.list(),
      ])

      setItems(navData.items.sort((a, b) => a.order - b.order))
      setPages(pagesData)
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      // Recalculate order based on current positions
      const itemsWithOrder = items.map((item, index) => ({
        ...item,
        order: index + 1,
      }))

      await navigationApi.update(NAVIGATION_KEY, { items: itemsWithOrder })
      toast.success('Navigation saved successfully.')
    } catch (err) {
      toast.error(extractErrorMessage(err))
      setError(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddItem = () => {
    const newItem: NavigationItem = {
      id: crypto.randomUUID(),
      label: '',
      type: 'page',
      slug: '',
      order: items.length + 1,
      isVisible: true,
    }
    setItems([...items, newItem])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newItems = [...items]
    ;[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]
    setItems(newItems)
  }

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return
    const newItems = [...items]
    ;[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]
    setItems(newItems)
  }

  const handleItemChange = (index: number, field: keyof NavigationItem, value: unknown) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Reset slug/url when type changes
    if (field === 'type') {
      if (value === 'page') {
        newItems[index].url = undefined
        newItems[index].newTab = undefined
        newItems[index].slug = ''
      } else {
        newItems[index].slug = undefined
        newItems[index].url = ''
        newItems[index].newTab = false
      }
    }

    setItems(newItems)
  }

  if (isLoading) {
    return (
      <AdminLayout title="Navigation">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Navigation">
      <div className="space-y-6">
        <ApiErrorDisplay error={error} />

        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Main Menu Items
              </h3>
              <Button type="button" variant="secondary" onClick={handleAddItem}>
                + Add Item
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No menu items yet. Click "Add Item" to create one.
              </p>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Item #{index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === items.length - 1}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Remove"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        id={`label-${index}`}
                        label="Label *"
                        value={item.label}
                        onChange={(e) => handleItemChange(index, 'label', e.target.value)}
                        placeholder="Menu item label"
                      />

                      <Select
                        id={`type-${index}`}
                        label="Type *"
                        value={item.type}
                        onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                      >
                        <option value="page">Internal Page</option>
                        <option value="external">External Link</option>
                      </Select>

                      {item.type === 'page' ? (
                        <Select
                          id={`slug-${index}`}
                          label="Page *"
                          value={item.slug || ''}
                          onChange={(e) => handleItemChange(index, 'slug', e.target.value)}
                        >
                          <option value="">Select a page...</option>
                          {pages.map((page) => (
                            <option key={page.id} value={page.slug}>
                              {page.title} (/{page.slug})
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          id={`url-${index}`}
                          label="URL *"
                          value={item.url || ''}
                          onChange={(e) => handleItemChange(index, 'url', e.target.value)}
                          placeholder="https://..."
                        />
                      )}

                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isVisible}
                            onChange={(e) => handleItemChange(index, 'isVisible', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Visible</span>
                        </label>

                        {item.type === 'external' && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.newTab || false}
                              onChange={(e) => handleItemChange(index, 'newTab', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Open in new tab</span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Navigation'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  )
}
