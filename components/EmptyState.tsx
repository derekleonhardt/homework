'use client'

import { Plus } from 'lucide-react'

interface EmptyStateProps {
  onAddClick?: () => void
  message?: string
}

export default function EmptyState({ onAddClick, message = 'No items' }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-32">
      {onAddClick ? (
        <button
          type="button"
          onClick={onAddClick}
          className="flex items-center gap-2 text-[var(--color-warm-400)] hover:text-[var(--color-warm-600)] transition-colors"
        >
          <Plus className="size-5" strokeWidth={1.5} />
          <span className="text-sm">Add your first link</span>
        </button>
      ) : (
        <p className="text-sm text-[var(--color-warm-400)]">{message}</p>
      )}
    </div>
  )
}
