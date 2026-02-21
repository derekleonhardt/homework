'use client'

import { Settings } from 'lucide-react'
import Link from 'next/link'

export function SidebarFooter() {
  return (
    <div className="px-3 py-3 border-t border-[var(--color-warm-300)] flex items-center justify-between">
      <span className="px-2 py-2 text-sm text-[var(--color-warm-500)]">Local mode</span>
      <Link
        href="/settings"
        aria-label="Settings"
        className="p-2 rounded-md text-[var(--color-warm-500)] hover:bg-[var(--color-warm-200)] hover:text-[var(--color-warm-600)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-warm-500)]"
      >
        <Settings className="size-4" strokeWidth={1.5} />
      </Link>
    </div>
  )
}
