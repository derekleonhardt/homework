'use client'

import EmptyState from '@/components/EmptyState'
import type { Item } from '@/lib/types'
import Masonry from 'react-masonry-css'
import GalleryCard from './GalleryCard'

const breakpointColumns = {
  default: 4,
  1024: 3, // lg
  640: 2, // sm
  0: 1, // base (mobile)
}

interface GalleryGridProps {
  items: Item[]
  onMarkAsRead?: (id: string) => void
  onRestore?: (id: string) => void
  onDelete?: (id: string) => void
  onAddClick?: () => void
}

export default function GalleryGrid({
  items,
  onMarkAsRead,
  onRestore,
  onDelete,
  onAddClick,
}: GalleryGridProps) {
  if (items.length === 0) {
    return <EmptyState onAddClick={onAddClick} />
  }

  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className="masonry-grid"
      columnClassName="masonry-grid-column"
      role="feed"
      aria-label="Saved items gallery"
    >
      {items.map((item, index) => (
        <GalleryCard
          key={item.id}
          item={item}
          index={index}
          onMarkAsRead={onMarkAsRead}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      ))}
    </Masonry>
  )
}
