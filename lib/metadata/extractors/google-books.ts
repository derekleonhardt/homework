import { logger } from '@/lib/logger'

const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1/volumes'
const FETCH_TIMEOUT_MS = 10_000

interface BookMetadata {
  title: string
  author: string | null
  description: string | null
  imageUrl: string | null
  pageCount: number | null
}

interface GoogleBooksVolumeInfo {
  title?: string
  authors?: string[]
  description?: string
  pageCount?: number
  imageLinks?: {
    thumbnail?: string
    smallThumbnail?: string
    small?: string
    medium?: string
    large?: string
    extraLarge?: string
  }
}

interface GoogleBooksResponse {
  totalItems?: number
  items?: Array<{
    id: string
    volumeInfo: GoogleBooksVolumeInfo
  }>
}

interface SearchOptions {
  useKeywords: boolean
  useApiKey: boolean
}

/**
 * Internal: Execute a single Google Books search with given options
 */
async function executeSearch(
  title: string,
  author: string | null | undefined,
  options: SearchOptions,
): Promise<BookMetadata | null> {
  try {
    // Build query based on options
    const query =
      options.useKeywords && author
        ? `intitle:${title}+inauthor:${author}`
        : options.useKeywords
          ? `intitle:${title}`
          : author
            ? `${title} ${author}`
            : title

    const url = new URL(GOOGLE_BOOKS_API_BASE)
    url.searchParams.set('q', query)
    url.searchParams.set('maxResults', '5')
    url.searchParams.set('printType', 'books')

    if (options.useApiKey) {
      const apiKey = process.env.GOOGLE_API_KEY
      if (apiKey) {
        url.searchParams.set('key', apiKey)
      }
    }

    logger.debug('Google Books API request', {
      url: url.toString(),
      title,
      author,
      options,
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown')

      if (response.status === 403) {
        logger.error(
          'Google Books API permission denied. Enable the Books API at: https://console.cloud.google.com/apis/library/books.googleapis.com',
          { status: response.status, error: errorText.slice(0, 200) },
        )
        return null
      }

      // Return null to trigger fallback, don't throw
      logger.warn('Google Books API request failed', {
        status: response.status,
        statusText: response.statusText,
        error: errorText.slice(0, 500),
        title,
        author,
      })
      return null
    }

    const data: GoogleBooksResponse = await response.json()

    logger.debug('Google Books API response', {
      totalItems: data.totalItems,
      itemCount: data.items?.length ?? 0,
      title,
      author,
    })

    if (!data.items || data.items.length === 0) {
      return null
    }

    const bestMatch = findBestMatch(data.items, title, author)
    if (!bestMatch) {
      return null
    }

    const { volumeInfo } = bestMatch

    return {
      title: volumeInfo.title || title,
      author: volumeInfo.authors?.join(', ') || author || null,
      description: volumeInfo.description?.slice(0, 1000) || null,
      imageUrl: getBestImageUrl(volumeInfo.imageLinks),
      pageCount: volumeInfo.pageCount || null,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('Google Books API request timed out', { title, author })
    } else {
      logger.error('Google Books API error', error, { title, author })
    }
    return null
  }
}

/**
 * Search Google Books API for a book by title and optional author.
 * Tries multiple search strategies with automatic fallback:
 * - If API key configured: Keywords with key → Simple with key → Simple without key
 * - If no API key: Keywords without key → Simple without key
 */
export async function searchBook(
  title: string,
  author?: string | null,
): Promise<BookMetadata | null> {
  const hasApiKey = !!process.env.GOOGLE_API_KEY

  // Strategy 1: Keywords search (most precise)
  let result = await executeSearch(title, author, { useKeywords: true, useApiKey: hasApiKey })
  if (result) return result

  // Strategy 2: Simple search (broader matching)
  logger.debug('Trying simple search', { title, author, hasApiKey })
  result = await executeSearch(title, author, { useKeywords: false, useApiKey: hasApiKey })
  if (result) return result

  // Strategy 3: Simple search without API key (fallback for quota issues, only if we had a key)
  if (hasApiKey) {
    logger.debug('Trying search without API key', { title, author })
    result = await executeSearch(title, author, { useKeywords: false, useApiKey: false })
  }

  return result
}

/**
 * Find the best matching book from search results.
 * Prioritizes exact title matches and author matches.
 */
function findBestMatch(
  items: NonNullable<GoogleBooksResponse['items']>,
  searchTitle: string,
  searchAuthor?: string | null,
): (typeof items)[0] | null {
  const normalizedSearchTitle = searchTitle.toLowerCase().trim()
  const normalizedSearchAuthor = searchAuthor?.toLowerCase().trim()

  const scored = items.map((item) => {
    let score = 0
    const info = item.volumeInfo

    // Title matching
    const itemTitle = info.title?.toLowerCase().trim() || ''
    if (itemTitle === normalizedSearchTitle) {
      score += 100
    } else if (itemTitle.includes(normalizedSearchTitle)) {
      score += 50
    } else if (normalizedSearchTitle.includes(itemTitle)) {
      score += 30
    }

    // Author matching
    if (normalizedSearchAuthor && info.authors) {
      const authorsLower = info.authors.map((a) => a.toLowerCase())
      if (authorsLower.some((a) => a.includes(normalizedSearchAuthor))) {
        score += 50
      } else if (authorsLower.some((a) => normalizedSearchAuthor.includes(a))) {
        score += 25
      }
    }

    // Prefer books with covers
    if (info.imageLinks?.thumbnail) {
      score += 10
    }

    // Prefer books with page counts
    if (info.pageCount) {
      score += 5
    }

    return { item, score }
  })

  scored.sort((a, b) => b.score - a.score)

  const best = scored[0]
  if (best && best.score > 0) {
    return best.item
  }

  return items[0]
}

/**
 * Get the best available image URL from Google Books imageLinks.
 */
function getBestImageUrl(imageLinks?: GoogleBooksVolumeInfo['imageLinks']): string | null {
  if (!imageLinks) return null

  const url =
    imageLinks.extraLarge ||
    imageLinks.large ||
    imageLinks.medium ||
    imageLinks.small ||
    imageLinks.thumbnail ||
    imageLinks.smallThumbnail

  if (!url) return null

  return url.replace('http://', 'https://').replace('&edge=curl', '').replace('zoom=1', 'zoom=0')
}
