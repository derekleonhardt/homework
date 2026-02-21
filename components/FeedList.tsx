'use client'

import type { Item } from '@/lib/types'
import EmptyState from './EmptyState'
import ListCard from './ListCard'

interface FeedListProps {
  items: Item[]
  onMarkAsRead?: (id: string) => void
  onRestore?: (id: string) => void
  onDelete?: (id: string) => void
  isArchiveView?: boolean
  onAddClick?: () => void
}

export default function FeedList({
  items,
  onMarkAsRead,
  onRestore,
  onDelete,
  isArchiveView,
  onAddClick,
}: FeedListProps) {
  if (items.length === 0) {
    return <EmptyState onAddClick={isArchiveView ? undefined : onAddClick} />
  }

  return (
    <div className="divide-y divide-[var(--color-warm-300)]">
      {items.map((item) => (
        <ListCard
          key={item.id}
          item={item}
          onMarkAsRead={onMarkAsRead}
          onRestore={onRestore}
          onDelete={onDelete}
          isArchived={isArchiveView}
        />
      ))}
    </div>
  )
}
