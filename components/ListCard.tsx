'use client'

import { TagChip } from '@/components/TagChip'
import { useItemDisplay } from '@/hooks/useItemDisplay'
import { getTopicTags } from '@/lib/tag-utils'
import type { Item } from '@/lib/types'
import { cn, formatRelativeDate, getCardImageSrc } from '@/lib/utils'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { Check, RotateCcw, Trash2 } from 'lucide-react'

interface ListCardProps {
  item: Item
  onMarkAsRead?: (id: string) => void
  onRestore?: (id: string) => void
  onDelete?: (id: string) => void
  isArchived?: boolean
}

export default function ListCard({
  item,
  onMarkAsRead,
  onRestore,
  onDelete,
  isArchived,
}: ListCardProps) {
  const { hasImage, hasUrl, source, metaText } = useItemDisplay(item)
  const topicTags = getTopicTags(item)
  const imageSrc = item.imageUrl ? getCardImageSrc(item.imageUrl) : null

  return (
    <article className={cn('group py-4', isArchived && 'opacity-60')}>
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        {hasImage &&
          imageSrc &&
          (hasUrl ? (
            <a
              href={item.url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-20 h-14 rounded overflow-hidden bg-[var(--color-warm-200)]"
            >
              <img src={imageSrc} alt="" className="size-full object-cover" />
            </a>
          ) : (
            <div className="flex-shrink-0 w-20 h-14 rounded overflow-hidden bg-[var(--color-warm-200)]">
              <img src={imageSrc} alt="" className="size-full object-cover" />
            </div>
          ))}

        {/* Content */}
        {hasUrl ? (
          <a
            href={item.url ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-0"
          >
            <h3
              className={cn(
                'font-[family-name:var(--font-lora)] text-[17px] font-semibold leading-snug line-clamp-2 text-balance transition-colors',
                isArchived
                  ? 'text-[var(--color-warm-500)]'
                  : 'text-[var(--color-warm-700)] group-hover:text-[var(--color-accent-500)]',
              )}
            >
              {item.title}
            </h3>
            <p className="mt-1.5 text-[13px] text-[var(--color-warm-500)] flex items-center gap-1.5">
              {source && <span className="font-medium text-[var(--color-warm-600)]">{source}</span>}
              {metaText && (
                <>
                  {source && <span className="text-[var(--color-warm-400)]">·</span>}
                  <span>{metaText}</span>
                </>
              )}
              {(source || metaText) && <span className="text-[var(--color-warm-400)]">·</span>}
              <span>{formatRelativeDate(item.createdAt)}</span>
            </p>
            {topicTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {topicTags.slice(0, 3).map((t) => (
                  <TagChip key={t.slug} tag={t} />
                ))}
              </div>
            )}
          </a>
        ) : (
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                'font-[family-name:var(--font-lora)] text-[17px] font-semibold leading-snug line-clamp-2 text-balance transition-colors',
                isArchived ? 'text-[var(--color-warm-500)]' : 'text-[var(--color-warm-700)]',
              )}
            >
              {item.title}
            </h3>
            <p className="mt-1.5 text-[13px] text-[var(--color-warm-500)] flex items-center gap-1.5">
              {source && <span className="font-medium text-[var(--color-warm-600)]">{source}</span>}
              {metaText && (
                <>
                  {source && <span className="text-[var(--color-warm-400)]">·</span>}
                  <span>{metaText}</span>
                </>
              )}
              {(source || metaText) && <span className="text-[var(--color-warm-400)]">·</span>}
              <span>{formatRelativeDate(item.createdAt)}</span>
            </p>
            {topicTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {topicTags.slice(0, 3).map((t) => (
                  <TagChip key={t.slug} tag={t} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Button - appears on hover */}
        <div className="flex-shrink-0 size-5 mt-1">
          {isArchived ? (
            <button
              type="button"
              onClick={() => onRestore?.(item.id)}
              aria-label="Restore item"
              className="size-5 rounded-full border border-[var(--color-warm-400)] flex items-center justify-center text-[var(--color-warm-400)] opacity-0 group-hover:opacity-100 hover:border-[var(--color-accent-500)] hover:text-[var(--color-accent-500)] transition-all"
            >
              <RotateCcw className="size-3" strokeWidth={2} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onMarkAsRead?.(item.id)}
              aria-label="Mark as read"
              className="size-5 rounded-full border border-[var(--color-warm-300)] opacity-0 group-hover:opacity-100 hover:border-[var(--color-accent-500)] hover:bg-[var(--color-accent-500)] group/check transition-all"
            >
              <Check
                className="size-3 mx-auto text-transparent group-hover/check:text-white transition-colors"
                strokeWidth={2.5}
              />
            </button>
          )}
        </div>

        {/* Delete Button with AlertDialog */}
        <AlertDialog.Root>
          <AlertDialog.Trigger asChild>
            <button
              type="button"
              aria-label="Delete item"
              className="flex-shrink-0 size-5 mt-1 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[var(--color-warm-400)] hover:text-red-500 transition-all"
            >
              <Trash2 className="size-4" strokeWidth={1.5} />
            </button>
          </AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-black/40 modal-overlay" />
            <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--color-warm-50)] rounded-lg border border-[var(--color-warm-300)] p-6 modal-content">
              <AlertDialog.Title className="text-lg font-semibold text-[var(--color-warm-700)] text-balance">
                Delete item?
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-[var(--color-warm-600)] text-pretty">
                This will permanently delete "{item.title}". This action cannot be undone.
              </AlertDialog.Description>
              <div className="mt-6 flex gap-3 justify-end">
                <AlertDialog.Cancel asChild>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-[var(--color-warm-200)] hover:bg-[var(--color-warm-300)] text-[var(--color-warm-700)] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <button
                    type="button"
                    onClick={() => onDelete?.(item.id)}
                    className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </div>
    </article>
  )
}
