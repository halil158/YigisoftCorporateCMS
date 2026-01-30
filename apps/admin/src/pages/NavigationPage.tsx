import { useState, useEffect } from 'react'
import { pagesApi, navigationApi, type NavigationItem, type NavigationItemRequest, type PageListItem } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { ApiErrorDisplay } from '../components/ApiErrorDisplay'
import { Button, Input, Select, Card, useToast, extractErrorMessage } from '../components/ui'

const NAVIGATION_KEY = 'main'
const MAX_DEPTH = 3

interface NavigationItemEditorProps {
  item: NavigationItem
  depth: number
  index: number
  siblingCount: number
  pages: PageListItem[]
  onUpdate: (item: NavigationItem) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onAddChild: () => void
}

function NavigationItemEditor({
  item,
  depth,
  index,
  siblingCount,
  pages,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddChild,
}: NavigationItemEditorProps) {
  const canHaveChildren = depth < MAX_DEPTH
  const canMoveUp = index > 0
  const canMoveDown = index < siblingCount - 1

  const handleFieldChange = (field: keyof NavigationItem, value: unknown) => {
    const updated = { ...item, [field]: value }

    // Reset slug/url when type changes
    if (field === 'type') {
      if (value === 'page') {
        updated.url = undefined
        updated.newTab = undefined
        updated.slug = ''
      } else if (value === 'external') {
        updated.slug = undefined
        updated.url = ''
        updated.newTab = false
      } else if (value === 'group') {
        // Group has no target - clear all link fields
        updated.slug = undefined
        updated.url = undefined
        updated.newTab = undefined
      }
    }

    onUpdate(updated)
  }

  // Group without children validation
  const isGroupWithoutChildren = item.type === 'group' && item.children.length === 0

  const handleChildUpdate = (childIndex: number, updatedChild: NavigationItem) => {
    const newChildren = [...item.children]
    newChildren[childIndex] = updatedChild
    onUpdate({ ...item, children: newChildren })
  }

  const handleChildRemove = (childIndex: number) => {
    const newChildren = item.children.filter((_, i) => i !== childIndex)
    onUpdate({ ...item, children: newChildren })
  }

  const handleChildMoveUp = (childIndex: number) => {
    if (childIndex === 0) return
    const newChildren = [...item.children]
    ;[newChildren[childIndex - 1], newChildren[childIndex]] = [newChildren[childIndex], newChildren[childIndex - 1]]
    onUpdate({ ...item, children: newChildren })
  }

  const handleChildMoveDown = (childIndex: number) => {
    if (childIndex === item.children.length - 1) return
    const newChildren = [...item.children]
    ;[newChildren[childIndex], newChildren[childIndex + 1]] = [newChildren[childIndex + 1], newChildren[childIndex]]
    onUpdate({ ...item, children: newChildren })
  }

  const handleAddChildToChild = (childIndex: number) => {
    const newChildren = [...item.children]
    const newGrandchild: NavigationItem = {
      id: crypto.randomUUID(),
      label: '',
      type: 'page',
      slug: '',
      order: newChildren[childIndex].children.length + 1,
      isVisible: true,
      children: [],
    }
    newChildren[childIndex] = {
      ...newChildren[childIndex],
      children: [...newChildren[childIndex].children, newGrandchild],
    }
    onUpdate({ ...item, children: newChildren })
  }

  const depthColors = [
    'border-l-primary-500',
    'border-l-blue-500',
    'border-l-purple-500',
  ]

  return (
    <div className={`border-l-4 ${depthColors[depth - 1] || 'border-l-gray-300'}`}>
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-r-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Level {depth} Item
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move up"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move down"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {canHaveChildren && (
              <button
                type="button"
                onClick={onAddChild}
                className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                title="Add child item"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={onRemove}
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
            id={`label-${item.id}`}
            label="Label *"
            value={item.label}
            onChange={(e) => handleFieldChange('label', e.target.value)}
            placeholder="Menu item label"
          />

          <Select
            id={`type-${item.id}`}
            label="Type *"
            value={item.type}
            onChange={(e) => handleFieldChange('type', e.target.value)}
          >
            <option value="page">Internal Page</option>
            <option value="external">External Link</option>
            <option value="group">Group (No Link)</option>
          </Select>

          {item.type === 'page' && (
            <div className="space-y-2">
              <Select
                id={`slug-${item.id}`}
                label="Page *"
                value={item.slug || ''}
                onChange={(e) => handleFieldChange('slug', e.target.value)}
              >
                <option value="">Select a page...</option>
                {pages.map((page) => (
                  <option key={page.id} value={page.slug}>
                    {page.title} (/{page.slug})
                  </option>
                ))}
              </Select>
              {item.slug && (() => {
                const linkedPage = pages.find((p) => p.slug === item.slug)
                if (linkedPage) {
                  return (
                    <a
                      href={`/admin/pages/${linkedPage.id}`}
                      className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Page
                    </a>
                  )
                }
                return (
                  <span className="text-sm text-amber-600 dark:text-amber-400">
                    Page not found
                  </span>
                )
              })()}
            </div>
          )}

          {item.type === 'external' && (
            <Input
              id={`url-${item.id}`}
              label="URL *"
              value={item.url || ''}
              onChange={(e) => handleFieldChange('url', e.target.value)}
              placeholder="https://..."
            />
          )}

          {item.type === 'group' && (
            <div className="flex items-center">
              {isGroupWithoutChildren ? (
                <p className="text-sm text-red-500 dark:text-red-400">
                  Group items must have at least one child item.
                </p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This item opens a dropdown menu only (no link).
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={item.isVisible}
                onChange={(e) => handleFieldChange('isVisible', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Visible</span>
            </label>

            {item.type === 'external' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.newTab || false}
                  onChange={(e) => handleFieldChange('newTab', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Open in new tab</span>
              </label>
            )}
          </div>
        </div>

        {/* Render children */}
        {item.children.length > 0 && (
          <div className="ml-4 mt-4 space-y-3">
            {item.children.map((child, childIndex) => (
              <NavigationItemEditor
                key={child.id}
                item={child}
                depth={depth + 1}
                index={childIndex}
                siblingCount={item.children.length}
                pages={pages}
                onUpdate={(updated) => handleChildUpdate(childIndex, updated)}
                onRemove={() => handleChildRemove(childIndex)}
                onMoveUp={() => handleChildMoveUp(childIndex)}
                onMoveDown={() => handleChildMoveDown(childIndex)}
                onAddChild={() => handleAddChildToChild(childIndex)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function convertToRequest(items: NavigationItem[]): NavigationItemRequest[] {
  return items.map((item, index) => ({
    id: item.id,
    label: item.label,
    type: item.type,
    slug: item.slug,
    url: item.url,
    order: index + 1,
    isVisible: item.isVisible,
    newTab: item.newTab,
    children: item.children.length > 0 ? convertToRequest(item.children) : undefined,
  }))
}

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

      // Ensure all items have children array (backward compatibility)
      const normalizeItems = (navItems: NavigationItem[]): NavigationItem[] => {
        return navItems
          .map((item) => ({
            ...item,
            children: item.children ? normalizeItems(item.children) : [],
          }))
          .sort((a, b) => a.order - b.order)
      }

      setItems(normalizeItems(navData.items))
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
      const requestItems = convertToRequest(items)
      await navigationApi.update(NAVIGATION_KEY, { items: requestItems })
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
      children: [],
    }
    setItems([...items, newItem])
  }

  const handleUpdateItem = (index: number, updated: NavigationItem) => {
    const newItems = [...items]
    newItems[index] = updated
    setItems(newItems)
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

  const handleAddChild = (index: number) => {
    const newItems = [...items]
    const newChild: NavigationItem = {
      id: crypto.randomUUID(),
      label: '',
      type: 'page',
      slug: '',
      order: newItems[index].children.length + 1,
      isVisible: true,
      children: [],
    }
    newItems[index] = {
      ...newItems[index],
      children: [...newItems[index].children, newChild],
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
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Main Menu Items
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Organize your navigation with up to 3 levels of hierarchy.
                </p>
              </div>
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
                  <NavigationItemEditor
                    key={item.id}
                    item={item}
                    depth={1}
                    index={index}
                    siblingCount={items.length}
                    pages={pages}
                    onUpdate={(updated) => handleUpdateItem(index, updated)}
                    onRemove={() => handleRemoveItem(index)}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                    onAddChild={() => handleAddChild(index)}
                  />
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
