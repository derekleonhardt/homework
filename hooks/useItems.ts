import { api } from '@/lib/api'
import type { Item, ViewMode, ViewType } from '@/lib/types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from './useDebounce'

interface UseItemsReturn {
  items: Item[]
  filteredItems: Item[]
  loading: boolean
  error: string | null
  itemCounts: { all: number; archive: number }
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  handleMarkAsRead: (id: string) => Promise<void>
  handleRestore: (id: string) => Promise<void>
  handleDelete: (id: string) => Promise<void>
  handleUrlAdded: (newItem: Item) => void
  clearError: () => void
}

export function useItems(searchQuery = '', activeView: ViewType = 'all'): UseItemsReturn {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewModeState] = useState<ViewMode>('grid')

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)

  useEffect(() => {
    const saved = localStorage.getItem('viewMode')
    if (saved === 'grid' || saved === 'list') setViewModeState(saved)
  }, [])

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode)
    localStorage.setItem('viewMode', mode)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const itemsData = await api.items.list()
      setItems(itemsData)
    } catch (err) {
      console.error('Failed to fetch items:', err)
      setError('Unable to load items. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredItems = useMemo(() => {
    let filtered =
      activeView === 'archive'
        ? items.filter((item) => item.status === 'archived')
        : items.filter((item) => item.status !== 'archived')

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.url?.toLowerCase().includes(query) ||
          item.siteName?.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [items, activeView, debouncedSearchQuery])

  const itemCounts = useMemo(
    () => ({
      all: items.filter((item) => item.status !== 'archived').length,
      archive: items.filter((item) => item.status === 'archived').length,
    }),
    [items],
  )

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      setError(null)
      await api.items.update(id, { status: 'archived' })
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'archived' } : item)),
      )
    } catch (err) {
      console.error('Failed to mark as read:', err)
      setError('Failed to archive item. Please try again.')
    }
  }, [])

  const handleRestore = useCallback(async (id: string) => {
    try {
      setError(null)
      await api.items.update(id, { status: 'inbox' })
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'inbox' } : item)))
    } catch (err) {
      console.error('Failed to restore item:', err)
      setError('Failed to restore item. Please try again.')
    }
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    try {
      setError(null)
      await api.items.delete(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      console.error('Failed to delete item:', err)
      setError('Failed to delete item. Please try again.')
    }
  }, [])

  const handleUrlAdded = useCallback((newItem: Item) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === newItem.id)

      if (existingIndex === -1) {
        return [newItem, ...prev]
      }

      const withoutExisting = prev.filter((item) => item.id !== newItem.id)
      return [newItem, ...withoutExisting]
    })
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    items,
    filteredItems,
    loading,
    error,
    itemCounts,
    viewMode,
    setViewMode,
    handleMarkAsRead,
    handleRestore,
    handleDelete,
    handleUrlAdded,
    clearError,
  }
}
