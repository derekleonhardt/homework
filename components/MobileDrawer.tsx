'use client'

import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useScrollLock } from '@/hooks/useScrollLock'
import type { ReactNode } from 'react'
import { useCallback, useRef } from 'react'

interface MobileDrawerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export default function MobileDrawer({ isOpen, onOpenChange, children }: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useScrollLock(isOpen)

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange])
  useFocusTrap({ isOpen, onClose: handleClose, containerRef: panelRef })

  if (!isOpen) return null

  return (
    // biome-ignore lint/a11y/useSemanticElements: custom dialog with specific styling/animations
    <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Backdrop */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop is decorative, keyboard handled via Escape */}
      <div
        className="absolute inset-0 bg-black/40 drawer-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        className="absolute top-0 left-0 bottom-0 w-72 bg-[var(--color-warm-100)] drawer-panel"
      >
        {children}
      </div>
    </div>
  )
}
