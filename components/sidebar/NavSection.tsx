'use client'

import type { ViewType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Archive, BookOpen } from 'lucide-react'

interface NavSectionProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  itemCounts?: { all: number; archive: number }
}

const navItems: { id: ViewType; label: string; icon: typeof BookOpen }[] = [
  { id: 'all', label: 'All Items', icon: BookOpen },
  { id: 'archive', label: 'Archive', icon: Archive },
]

export function NavSection({ activeView, onViewChange, itemCounts }: NavSectionProps) {
  return (
    <nav className="px-3 py-4">
      <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-warm-500)]">
        Library
      </p>
      <ul className="space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          const count = itemCounts?.[item.id]

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-warm-500)]',
                  isActive
                    ? 'font-medium text-[var(--color-warm-700)] bg-[var(--color-warm-200)]'
                    : 'text-[var(--color-warm-600)] hover:bg-[var(--color-warm-200)] hover:text-[var(--color-warm-700)]',
                )}
              >
                <Icon className="size-4" strokeWidth={1.5} />
                <span className="flex-1 text-left">{item.label}</span>
                {count !== undefined && count > 0 && (
                  <span className="text-xs tabular-nums text-[var(--color-warm-500)]">{count}</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
