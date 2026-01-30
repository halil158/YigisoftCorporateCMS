import { useState, useEffect } from 'react'
import { fetchNavigation, type NavigationItem } from '../api/client'

interface UseNavigationResult {
  items: NavigationItem[]
  isLoading: boolean
  error: Error | null
}

/**
 * Recursively filter to visible items and sort by order.
 * Also ensures children array is always present.
 */
function filterAndSortItems(items: NavigationItem[]): NavigationItem[] {
  return items
    .filter((item) => item.isVisible)
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      ...item,
      children: item.children ? filterAndSortItems(item.children) : [],
    }))
}

export function useNavigation(key: string = 'main'): UseNavigationResult {
  const [items, setItems] = useState<NavigationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchNavigation(key)
        if (!cancelled) {
          // Recursively filter to visible items and sort by order
          const visibleItems = filterAndSortItems(data.items)
          setItems(visibleItems)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load navigation'))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [key])

  return { items, isLoading, error }
}
