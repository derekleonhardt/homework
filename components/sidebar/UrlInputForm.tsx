'use client'

import { api } from '@/lib/api'
import type { Item } from '@/lib/types'
import { ArrowRight, Loader2, X } from 'lucide-react'
import type { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'

interface UrlInputFormProps {
  isExpanded: boolean
  onExpandedChange: (expanded: boolean) => void
  onUrlAdded: (item: Item) => void
  onNavItemClick?: () => void
  inputRef?: RefObject<HTMLInputElement | null>
}

export function UrlInputForm({
  isExpanded,
  onExpandedChange,
  onUrlAdded,
  onNavItemClick,
  inputRef: externalInputRef,
}: UrlInputFormProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const internalInputRef = useRef<HTMLInputElement>(null)
  const inputRef = externalInputRef ?? internalInputRef

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus()
    }
  }, [isExpanded, inputRef])

  const handleCollapse = () => {
    onExpandedChange(false)
    setInput('')
    setError(undefined)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    setError(undefined)

    try {
      const { item } = await api.items.ingest({ input: input.trim() })
      setInput('')
      onUrlAdded(item)
      onNavItemClick?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCollapse()
    }
  }

  if (!isExpanded) return null

  return (
    <div className="px-3 pb-3">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add anything..."
            className="w-full pl-3 pr-8 py-2 text-sm bg-[var(--color-warm-100)] border border-[var(--color-warm-300)] rounded-lg text-[var(--color-warm-700)] placeholder:text-[var(--color-warm-500)] focus:outline-none focus:border-[var(--color-accent-500)] focus:ring-1 focus:ring-[var(--color-accent-500)]/20 transition-colors"
            disabled={isLoading}
            autoComplete="off"
          />
          {isLoading ? (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5">
              <Loader2 className="size-4 animate-spin text-[var(--color-accent-500)]" />
            </div>
          ) : input.trim() ? (
            <button
              type="submit"
              aria-label="Save"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[var(--color-accent-500)] hover:text-[var(--color-accent-600)] transition-colors"
            >
              <ArrowRight className="size-4" strokeWidth={2} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCollapse}
              aria-label="Close"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[var(--color-warm-400)] hover:text-[var(--color-warm-600)] transition-colors"
              tabIndex={-1}
            >
              <X className="size-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
        {error && <p className="mt-1 px-1 text-xs text-red-600 text-pretty">{error}</p>}
      </form>
    </div>
  )
}
