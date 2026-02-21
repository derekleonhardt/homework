'use client'

import { TagChip } from '@/components/TagChip'
import { useIsTouchDevice } from '@/hooks/useIsTouchDevice'
import { useItemDisplay } from '@/hooks/useItemDisplay'
import { useLongPress } from '@/hooks/useLongPress'
import { type TopicTag, getTopicTags } from '@/lib/tag-utils'
import type { Item } from '@/lib/types'
import { cn, getCardImageSrc, getContentGradient } from '@/lib/utils'
import { useCallback, useState } from 'react'
import CardActions from './CardActions'
import CardContextMenu from './CardContextMenu'

interface CardContentProps {
  item: Item
  hasImage: boolean
  source: string | null
  typeLabel: string
  readingTimeText?: string
  pageCountText?: string
  isBook: boolean
  topicTags: TopicTag[]
}

function CardContent({
  item,
  hasImage,
  source,
  typeLabel,
  readingTimeText,
  pageCountText,
  isBook,
  topicTags,
}: CardContentProps) {
  // For books, show author as the source
  const displaySource = isBook ? item.author : source
  // For books, show page count instead of reading time
  const metaText = isBook ? pageCountText : readingTimeText

  if (hasImage && item.imageUrl) {
    const imageSrc = getCardImageSrc(item.imageUrl)
    return (
      <div>
        {/* Image at natural aspect ratio - no cropping */}
        <img src={imageSrc} alt="" className="card-image w-full h-auto block" loading="lazy" />
        <div className="p-3">
          <h3 className="font-[family-name:var(--font-lora)] font-semibold text-[var(--color-warm-700)] text-[15px] leading-snug line-clamp-2">
            {item.title}
          </h3>
          <p className="mt-1.5 font-[family-name:var(--font-dm-sans)] text-[var(--color-warm-500)] text-xs flex items-center gap-1 min-w-0">
            {displaySource && (
              <>
                <span className="font-medium text-[var(--color-warm-600)] truncate">
                  {displaySource}
                </span>
                <span className="text-[var(--color-warm-400)] flex-shrink-0">&middot;</span>
              </>
            )}
            <span className="flex-shrink-0">{typeLabel}</span>
            {metaText && (
              <>
                <span className="text-[var(--color-warm-400)] flex-shrink-0">&middot;</span>
                <span className="flex-shrink-0">{metaText}</span>
              </>
            )}
          </p>
          {topicTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {topicTags.slice(0, 3).map((t) => (
                <TagChip key={t.slug} tag={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="aspect-[3/4] flex flex-col justify-between p-5"
      style={{ background: getContentGradient(item.type) }}
    >
      <div className="flex-1 flex items-center justify-center">
        <h3
          className={cn(
            'font-[family-name:var(--font-lora)] font-bold text-white text-xl leading-tight text-center line-clamp-6',
            'text-balance',
          )}
        >
          {item.title}
        </h3>
      </div>
      <div className="font-[family-name:var(--font-dm-sans)] text-white/80 text-sm min-w-0">
        {displaySource && <p className="font-medium text-white truncate">{displaySource}</p>}
        <p className="flex items-center gap-1.5 mt-1 text-white/60">
          <span>{typeLabel}</span>
          {metaText && (
            <>
              <span>&middot;</span>
              <span>{metaText}</span>
            </>
          )}
        </p>
        {topicTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {topicTags.slice(0, 3).map((t) => (
              <TagChip key={t.slug} tag={{ ...t, color: '#ffffff' }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface GalleryCardProps {
  item: Item
  index: number
  onMarkAsRead?: (id: string) => void
  onRestore?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function GalleryCard({
  item,
  index,
  onMarkAsRead,
  onRestore,
  onDelete,
}: GalleryCardProps) {
  const isTouchDevice = useIsTouchDevice()
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const { hasImage, source, isBook, readingTimeText, pageCountText, typeLabel } =
    useItemDisplay(item)
  const topicTags = getTopicTags(item)

  const handleLongPress = useCallback(() => {
    setContextMenuOpen(true)
  }, [])

  const { onClick: longPressOnClick, ...longPressTouchHandlers } = useLongPress({
    onLongPress: handleLongPress,
  })

  const url = item.url

  // Memoized handlers to prevent unnecessary re-renders of child components
  const handleMarkAsRead = useCallback(() => {
    onMarkAsRead?.(item.id)
  }, [onMarkAsRead, item.id])

  const handleRestore = useCallback(() => {
    onRestore?.(item.id)
  }, [onRestore, item.id])

  const handleDelete = useCallback(() => {
    onDelete?.(item.id)
  }, [onDelete, item.id])

  const handleContextMenuClose = useCallback(() => {
    setContextMenuOpen(false)
  }, [])

  const handleOpenOriginal = useCallback(() => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }, [url])

  // TODO: hover transforms can cause jitter on lower-end devices.
  // Revisit with will-change/transform-gpu once root cause is isolated.
  return (
    <>
      <article
        className="gallery-card group relative rounded-xl overflow-hidden bg-[var(--color-warm-50)] border border-transparent dark:border-[var(--color-warm-200)] shadow-sm hover:shadow-lg transition-shadow duration-200"
        style={
          {
            '--card-index': index,
          } as React.CSSProperties
        }
        {...(isTouchDevice ? longPressTouchHandlers : {})}
      >
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-500)] focus-visible:ring-inset rounded-xl"
            style={{ touchAction: 'manipulation' }}
            onClick={isTouchDevice ? longPressOnClick : undefined}
          >
            <CardContent
              item={item}
              hasImage={hasImage}
              source={source}
              typeLabel={typeLabel}
              readingTimeText={readingTimeText}
              pageCountText={pageCountText}
              isBook={isBook}
              topicTags={topicTags}
            />
          </a>
        ) : (
          <div
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-500)] focus-visible:ring-inset rounded-xl"
            style={{ touchAction: 'manipulation' }}
            {...(isTouchDevice ? { onClick: longPressOnClick } : {})}
          >
            <CardContent
              item={item}
              hasImage={hasImage}
              source={source}
              typeLabel={typeLabel}
              readingTimeText={readingTimeText}
              pageCountText={pageCountText}
              isBook={isBook}
              topicTags={topicTags}
            />
          </div>
        )}

        <CardActions
          onMarkAsRead={onMarkAsRead ? handleMarkAsRead : undefined}
          onRestore={onRestore ? handleRestore : undefined}
          onDelete={onDelete ? handleDelete : undefined}
        />
      </article>

      {isTouchDevice && (
        <CardContextMenu
          isOpen={contextMenuOpen}
          onClose={handleContextMenuClose}
          onMarkAsRead={onMarkAsRead ? handleMarkAsRead : undefined}
          onRestore={onRestore ? handleRestore : undefined}
          onOpenOriginal={url ? handleOpenOriginal : undefined}
          onDelete={onDelete ? handleDelete : undefined}
        />
      )}
    </>
  )
}
