import type { Item } from '@/lib/types'
import { getDomain } from '@/lib/utils'
import { useMemo } from 'react'

interface ItemDisplayData {
  hasImage: boolean
  hasUrl: boolean
  source: string | null
  isBook: boolean
  readingTimeText?: string
  pageCountText?: string
  metaText?: string
  typeLabel: string
}

export function useItemDisplay(item: Item): ItemDisplayData {
  return useMemo(() => {
    const hasImage = Boolean(item.imageUrl) && item.metadataStatus === 'completed'
    const hasUrl = Boolean(item.url)
    const source = item.siteName || (item.url ? getDomain(item.url) : null)
    const isBook = item.type === 'book'

    const readingTimeText = item.readingTime ? `${item.readingTime} min` : undefined
    const pageCountText = item.pageCount ? `${item.pageCount} pages` : undefined
    const metaText = isBook ? pageCountText : readingTimeText
    const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1)

    return {
      hasImage,
      hasUrl,
      source,
      isBook,
      readingTimeText,
      pageCountText,
      metaText,
      typeLabel,
    }
  }, [
    item.imageUrl,
    item.metadataStatus,
    item.url,
    item.siteName,
    item.type,
    item.readingTime,
    item.pageCount,
  ])
}
