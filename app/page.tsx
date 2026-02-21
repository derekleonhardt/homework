'use client'

import FeedList from '@/components/FeedList'
import MobileDrawer from '@/components/MobileDrawer'
import Sidebar, { SidebarContent, type ViewType } from '@/components/Sidebar'
import { useThemeContext } from '@/components/ThemeProvider'
import GalleryGrid from '@/components/gallery/GalleryGrid'
import { useItems } from '@/hooks/useItems'
import { LayoutGrid, List, Menu, Moon, Search, Sun, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

function GallerySkeleton() {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="mb-4 break-inside-avoid">
          <div
            className="rounded-xl skeleton"
            style={{ aspectRatio: i % 2 === 0 ? '4/3' : '4/5' }}
          />
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isUrlInputExpanded, setIsUrlInputExpanded] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const sidebarInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)

  const { theme, toggleTheme } = useThemeContext()

  const {
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
  } = useItems(searchQuery, activeView)

  const handleUrlAddedWithCollapse = useCallback(
    (newItem: Parameters<typeof handleUrlAdded>[0]) => {
      setIsUrlInputExpanded(false)
      handleUrlAdded(newItem)
    },
    [handleUrlAdded],
  )

  const handleAddClick = useCallback(() => {
    setIsUrlInputExpanded(true)
    if (window.innerWidth < 768) {
      setDrawerOpen(true)
    }
  }, [])

  return (
    <div className="min-h-dvh bg-[var(--color-warm-100)]">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onUrlAdded={handleUrlAddedWithCollapse}
        itemCounts={itemCounts}
        isUrlInputExpanded={isUrlInputExpanded}
        onUrlInputExpandedChange={setIsUrlInputExpanded}
        inputRef={sidebarInputRef}
      />

      <MobileDrawer isOpen={drawerOpen} onOpenChange={setDrawerOpen}>
        <SidebarContent
          activeView={activeView}
          onViewChange={setActiveView}
          onUrlAdded={handleUrlAddedWithCollapse}
          itemCounts={itemCounts}
          isUrlInputExpanded={isUrlInputExpanded}
          onUrlInputExpandedChange={setIsUrlInputExpanded}
          inputRef={mobileInputRef}
          onNavItemClick={() => setDrawerOpen(false)}
          onClose={() => setDrawerOpen(false)}
        />
      </MobileDrawer>

      <main id="main-content" className="md:ml-60 min-h-dvh bg-[var(--color-warm-50)]">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-[var(--color-warm-50)]/95 backdrop-blur-sm px-4 py-3 md:px-6 flex items-center gap-3">
          {/* Mobile: Menu trigger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="md:hidden p-2 rounded-lg text-[var(--color-warm-600)] hover:bg-[var(--color-warm-200)] transition-colors"
          >
            <Menu className="size-5" strokeWidth={1.5} />
          </button>

          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-warm-500)] pointer-events-none"
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-warm-200)] border border-transparent rounded-lg text-[var(--color-warm-700)] placeholder:text-[var(--color-warm-500)] focus:outline-none focus:border-[var(--color-accent-500)] focus:ring-1 focus:ring-[var(--color-accent-500)] transition-all duration-200"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-[var(--color-warm-200)] rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={`p-1.5 rounded-md transition-all duration-150 ${viewMode === 'grid' ? 'text-[var(--color-warm-700)] bg-[var(--color-warm-50)] shadow-sm' : 'text-[var(--color-warm-500)] hover:text-[var(--color-warm-600)]'}`}
            >
              <LayoutGrid className="size-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              className={`p-1.5 rounded-md transition-all duration-150 ${viewMode === 'list' ? 'text-[var(--color-warm-700)] bg-[var(--color-warm-50)] shadow-sm' : 'text-[var(--color-warm-500)] hover:text-[var(--color-warm-600)]'}`}
            >
              <List className="size-4" strokeWidth={1.75} />
            </button>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center p-1 bg-[var(--color-warm-200)] rounded-lg">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              className="p-1.5 rounded-md text-[var(--color-warm-500)] hover:text-[var(--color-warm-600)] transition-all duration-150"
            >
              {theme === 'light' ? (
                <Moon className="size-4" strokeWidth={1.75} />
              ) : (
                <Sun className="size-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-4 mb-4 md:mx-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={clearError}
              className="text-red-500 hover:text-red-700 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <div className="px-4 pb-6 md:px-6">
          {loading ? (
            <GallerySkeleton />
          ) : viewMode === 'grid' ? (
            <GalleryGrid
              items={filteredItems}
              onMarkAsRead={activeView === 'archive' ? undefined : handleMarkAsRead}
              onRestore={activeView === 'archive' ? handleRestore : undefined}
              onDelete={handleDelete}
              onAddClick={activeView === 'archive' ? undefined : handleAddClick}
            />
          ) : (
            <FeedList
              items={filteredItems}
              onMarkAsRead={activeView === 'archive' ? undefined : handleMarkAsRead}
              onRestore={activeView === 'archive' ? handleRestore : undefined}
              onDelete={handleDelete}
              isArchiveView={activeView === 'archive'}
              onAddClick={activeView === 'archive' ? undefined : handleAddClick}
            />
          )}
        </div>
      </main>
    </div>
  )
}
