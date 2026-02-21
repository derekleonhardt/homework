'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react'

interface CardActionsProps {
  onMarkAsRead?: () => void
  onRestore?: () => void
  onDelete?: () => void
}

export default function CardActions({ onMarkAsRead, onRestore, onDelete }: CardActionsProps) {
  return (
    <div
      className="absolute top-2 right-2 flex gap-1.5 opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 pointer-events-none md:group-hover:pointer-events-auto"
      aria-label="Card actions"
    >
      {onMarkAsRead && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onMarkAsRead()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              onMarkAsRead()
            }
          }}
          aria-label="Mark as done"
          className="size-8 rounded-full bg-black/50  flex items-center justify-center text-white/90 hover:bg-black/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition-colors"
        >
          <Check className="size-4" strokeWidth={2} aria-hidden="true" />
        </button>
      )}

      {onRestore && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRestore()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              onRestore()
            }
          }}
          aria-label="Restore item"
          className="size-8 rounded-full bg-black/50  flex items-center justify-center text-white/90 hover:bg-black/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition-colors"
        >
          <RotateCcw className="size-4" strokeWidth={2} aria-hidden="true" />
        </button>
      )}

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label="More options"
            className="size-8 rounded-full bg-black/50  flex items-center justify-center text-white/90 hover:bg-black/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition-colors"
          >
            <MoreHorizontal className="size-4" strokeWidth={2} aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[160px] bg-[var(--color-warm-50)] rounded-lg border border-[var(--color-warm-200)] shadow-lg py-1 z-50"
            sideOffset={4}
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            {onDelete && (
              <DropdownMenu.Item
                className="px-3 py-2 text-sm text-red-500 hover:bg-[var(--color-warm-100)] focus:bg-[var(--color-warm-100)] outline-none cursor-pointer flex items-center gap-2"
                onSelect={onDelete}
              >
                <Trash2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
                Delete
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
