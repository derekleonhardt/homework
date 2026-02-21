'use client'

import type { Item, ViewType } from '@/lib/types'
import { FolderOpen, Plus, X } from 'lucide-react'
import type { RefObject } from 'react'
import { useState } from 'react'
import { NavSection } from './sidebar/NavSection'
import { SidebarFooter } from './sidebar/SidebarFooter'
import { UrlInputForm } from './sidebar/UrlInputForm'

export type { ViewType } from '@/lib/types'

interface SidebarContentProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  onUrlAdded: (item: Item) => void
  itemCounts?: { all: number; archive: number }
  isUrlInputExpanded?: boolean
  onUrlInputExpandedChange?: (expanded: boolean) => void
  inputRef?: RefObject<HTMLInputElement | null>
  onNavItemClick?: () => void
  hideHeader?: boolean
  onClose?: () => void
}

export function SidebarContent({
  activeView,
  onViewChange,
  onUrlAdded,
  itemCounts,
  isUrlInputExpanded: controlledExpanded,
  onUrlInputExpandedChange,
  inputRef,
  onNavItemClick,
  hideHeader,
  onClose,
}: SidebarContentProps) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const isExpanded = controlledExpanded ?? internalExpanded
  const setIsExpanded = onUrlInputExpandedChange ?? setInternalExpanded

  const handleExpand = () => {
    setIsExpanded(true)
  }

  const handleViewChange = (view: ViewType) => {
    onViewChange(view)
    onNavItemClick?.()
  }

  return (
    <div className="h-full flex flex-col pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      {!hideHeader && (
        <div className="px-3 py-4 flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="size-7 rounded-md hover:bg-[var(--color-warm-200)] flex items-center justify-center text-[var(--color-warm-500)] transition-colors"
            >
              <X className="size-4" strokeWidth={1.5} />
            </button>
          )}
          <h1 className="flex-1 font-[family-name:var(--font-lora)] text-xl font-medium text-[var(--color-warm-700)] pl-2 text-balance">
            Homework
          </h1>
          <button
            type="button"
            onClick={handleExpand}
            aria-label="Add URL"
            className="size-7 rounded-md bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-500)] focus-visible:ring-offset-2"
          >
            <Plus className="size-4 text-white" strokeWidth={2.5} />
          </button>
        </div>
      )}

      <UrlInputForm
        isExpanded={isExpanded}
        onExpandedChange={setIsExpanded}
        onUrlAdded={onUrlAdded}
        onNavItemClick={onNavItemClick}
        inputRef={inputRef}
      />

      {/* Divider */}
      <div className="mx-4 border-t border-[var(--color-warm-300)]" />

      <NavSection activeView={activeView} onViewChange={handleViewChange} itemCounts={itemCounts} />

      {/* Divider */}
      <div className="mx-4 border-t border-[var(--color-warm-300)]" />

      {/* Collections */}
      <nav className="px-3 py-4 flex-1">
        <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-warm-500)]">
          Collections
        </p>
        <div className="px-2 py-3 text-sm text-[var(--color-warm-500)] flex items-center gap-2">
          <FolderOpen className="size-4" strokeWidth={1.5} />
          <span className="italic">Coming soon</span>
        </div>
      </nav>

      <SidebarFooter />
    </div>
  )
}

interface SidebarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  onUrlAdded: (item: Item) => void
  itemCounts?: { all: number; archive: number }
  isUrlInputExpanded?: boolean
  onUrlInputExpandedChange?: (expanded: boolean) => void
  inputRef?: RefObject<HTMLInputElement | null>
}

export default function Sidebar(props: SidebarProps) {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-dvh w-60 bg-[var(--color-warm-100)] border-r border-[var(--color-warm-300)] flex-col">
      <SidebarContent {...props} />
    </aside>
  )
}
