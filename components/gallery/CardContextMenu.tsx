'use client'

import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useScrollLock } from '@/hooks/useScrollLock'
import { Check, ExternalLink, RotateCcw, Trash2, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface CardContextMenuProps {
  isOpen: boolean
  onClose: () => void
  onMarkAsRead?: () => void
  onRestore?: () => void
  onOpenOriginal?: () => void
  onDelete?: () => void
}

export default function CardContextMenu({
  isOpen,
  onClose,
  onMarkAsRead,
  onRestore,
  onOpenOriginal,
  onDelete,
}: CardContextMenuProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useScrollLock(isOpen)
  useFocusTrap({ isOpen, onClose, containerRef: sheetRef })

  // Focus management: save previous focus, focus first button, restore on cleanup
  useEffect(() => {
    if (!isOpen) return

    const previousFocus = document.activeElement as HTMLElement
    const firstButton = sheetRef.current?.querySelector('button')
    firstButton?.focus()

    return () => {
      previousFocus?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleAction = (action: () => void) => {
    action()
    onClose()
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: custom dialog with specific styling/animations
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Backdrop */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop is decorative, keyboard handled via Escape */}
      <div
        className="absolute inset-0 bg-black/40 context-menu-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-[var(--color-warm-50)] rounded-t-2xl context-menu-sheet pb-[env(safe-area-inset-bottom)]"
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 rounded-full bg-[var(--color-warm-300)]" />
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 space-y-1">
          {onMarkAsRead && (
            <button
              type="button"
              onClick={() => handleAction(onMarkAsRead)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[var(--color-warm-700)] hover:bg-[var(--color-warm-100)] active:bg-[var(--color-warm-200)] transition-colors"
            >
              <Check className="size-5" strokeWidth={1.5} />
              <span className="text-base">Mark as done</span>
            </button>
          )}

          {onRestore && (
            <button
              type="button"
              onClick={() => handleAction(onRestore)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[var(--color-warm-700)] hover:bg-[var(--color-warm-100)] active:bg-[var(--color-warm-200)] transition-colors"
            >
              <RotateCcw className="size-5" strokeWidth={1.5} />
              <span className="text-base">Restore</span>
            </button>
          )}

          {onOpenOriginal && (
            <button
              type="button"
              onClick={() => handleAction(onOpenOriginal)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[var(--color-warm-700)] hover:bg-[var(--color-warm-100)] active:bg-[var(--color-warm-200)] transition-colors"
            >
              <ExternalLink className="size-5" strokeWidth={1.5} />
              <span className="text-base">Open link</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => handleAction(onDelete)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
            >
              <Trash2 className="size-5" strokeWidth={1.5} />
              <span className="text-base">Delete</span>
            </button>
          )}
        </div>

        {/* Cancel button */}
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[var(--color-warm-100)] text-[var(--color-warm-600)] hover:bg-[var(--color-warm-200)] active:bg-[var(--color-warm-300)] transition-colors"
          >
            <X className="size-5" strokeWidth={1.5} />
            <span className="text-base font-medium">Cancel</span>
          </button>
        </div>
      </div>
    </div>
  )
}
