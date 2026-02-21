import * as cheerio from 'cheerio'
import metascraper from 'metascraper'
import metascraperAuthor from 'metascraper-author'
import metascraperDate from 'metascraper-date'
import metascraperDescription from 'metascraper-description'
import metascraperImage from 'metascraper-image'
import metascraperPublisher from 'metascraper-publisher'
import metascraperTitle from 'metascraper-title'

import { logger } from '@/lib/logger'
import type { ContentType } from '@/lib/types'
import { extractOEmbedMetadata } from './extractors/oembed'
import { extractTwitterMetadata, isTwitterUrl } from './extractors/twitter'
import { extractYouTubeMetadata, isYouTubeUrl } from './extractors/youtube'

// Base metadata without enrichmentSource (used by individual extractors)
export interface BaseExtractedMetadata {
  title: string | null
  description: string | null
  imageUrl: string | null
  imageWidth: number | null
  imageHeight: number | null
  faviconUrl: string | null
  siteName: string | null
  author: string | null
  publishedAt: string | null
  wordCount: number | null
  readingTime: number | null
}

// Full metadata with enrichmentSource (returned by extractMetadata)
export interface ExtractedMetadata extends BaseExtractedMetadata {
  enrichmentSource: string // "youtube" | "twitter" | "oembed" | "metascraper" | "google_books"
  typeOverride?: ContentType
}

const scraper = metascraper([
  metascraperTitle(),
  metascraperDescription(),
  metascraperImage(),
  metascraperAuthor(),
  metascraperDate(),
  metascraperPublisher(),
])

const AVERAGE_WPM = 200

function createEmptyMetadata(): ExtractedMetadata {
  return {
    title: null,
    description: null,
    imageUrl: null,
    imageWidth: null,
    imageHeight: null,
    faviconUrl: null,
    siteName: null,
    author: null,
    publishedAt: null,
    wordCount: null,
    readingTime: null,
    enrichmentSource: 'metascraper',
  }
}

function extractFavicon(html: string, url: string): string | null {
  const $ = cheerio.load(html)
  const baseUrl = new URL(url)

  // Try various favicon selectors in order of preference
  const selectors = [
    'link[rel="icon"][type="image/png"]',
    'link[rel="icon"][type="image/svg+xml"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="icon"]',
  ]

  for (const selector of selectors) {
    const href = $(selector).attr('href')
    if (href) {
      try {
        return new URL(href, baseUrl.origin).href
      } catch {
        // Invalid URL, try next selector
      }
    }
  }

  // Fallback to /favicon.ico
  return `${baseUrl.origin}/favicon.ico`
}

function extractWordCount(html: string): number {
  const $ = cheerio.load(html)

  // Remove script, style, and nav elements
  $('script, style, nav, header, footer, aside').remove()

  // Try to find main content areas
  const contentSelectors = [
    'article',
    'main',
    '[role="main"]',
    '.content',
    '.post-content',
    '.entry-content',
  ]

  let text = ''
  for (const selector of contentSelectors) {
    const content = $(selector).text()
    if (content && content.length > text.length) {
      text = content
    }
  }

  // Fallback to body if no content area found
  if (!text || text.length < 100) {
    text = $('body').text()
  }

  // Clean and count words
  const words = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((word) => word.length > 0)

  return words.length
}

function calculateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / AVERAGE_WPM))
}

const MIN_IMAGE_DIMENSION = 1
const MAX_IMAGE_DIMENSION = 8192

function isValidDimension(value: number): boolean {
  return !Number.isNaN(value) && value >= MIN_IMAGE_DIMENSION && value <= MAX_IMAGE_DIMENSION
}

function extractImageDimensions(html: string): { width: number | null; height: number | null } {
  const $ = cheerio.load(html)

  // Try og:image:width and og:image:height first
  const ogWidth = $('meta[property="og:image:width"]').attr('content')
  const ogHeight = $('meta[property="og:image:height"]').attr('content')

  if (ogWidth && ogHeight) {
    const width = Number.parseInt(ogWidth, 10)
    const height = Number.parseInt(ogHeight, 10)
    if (isValidDimension(width) && isValidDimension(height)) {
      return { width, height }
    }
  }

  // Try twitter:image:width and twitter:image:height
  const twWidth = $('meta[name="twitter:image:width"]').attr('content')
  const twHeight = $('meta[name="twitter:image:height"]').attr('content')

  if (twWidth && twHeight) {
    const width = Number.parseInt(twWidth, 10)
    const height = Number.parseInt(twHeight, 10)
    if (isValidDimension(width) && isValidDimension(height)) {
      return { width, height }
    }
  }

  return { width: null, height: null }
}

// Metascraper-based extraction (fallback for regular websites)
async function extractWithMetascraper(url: string): Promise<ExtractedMetadata> {
  try {
    // Add timeout to prevent hanging (30 seconds)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      logger.warn('Failed to fetch URL for metadata', { url, status: response.status })
      return createEmptyMetadata()
    }

    const html = await response.text()
    const metadata = await scraper({ html, url })

    const wordCount = extractWordCount(html)
    const readingTime = calculateReadingTime(wordCount)
    const faviconUrl = extractFavicon(html, url)
    const { width: imageWidth, height: imageHeight } = extractImageDimensions(html)

    return {
      title: metadata.title || null,
      description: metadata.description || null,
      imageUrl: metadata.image || null,
      imageWidth,
      imageHeight,
      faviconUrl,
      siteName: metadata.publisher || null,
      author: metadata.author || null,
      publishedAt: metadata.date || null,
      wordCount,
      readingTime,
      enrichmentSource: 'metascraper',
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('Metadata extraction timed out', { url })
    } else {
      logger.error('Metadata extraction failed', error, { url })
    }
    return createEmptyMetadata()
  }
}

// Main extraction function with platform-aware routing
export async function extractMetadata(url: string): Promise<ExtractedMetadata> {
  // Try platform-specific extractors first (they provide better results)

  // YouTube: Use YouTube Data API for reliable video metadata
  if (isYouTubeUrl(url)) {
    const metadata = await extractYouTubeMetadata(url)
    if (metadata) {
      logger.debug('Extracted YouTube metadata', { url })
      return { ...metadata, enrichmentSource: 'youtube' }
    }
    // Fall through to metascraper if API fails
  }

  // Twitter/X: Use X API for tweet/article content
  if (isTwitterUrl(url)) {
    const metadata = await extractTwitterMetadata(url)
    if (metadata) {
      logger.debug('Extracted Twitter metadata', { url })
      const isArticle = metadata.readingTime === null
      return {
        ...metadata,
        enrichmentSource: 'twitter',
        typeOverride: isArticle ? 'article' : undefined,
      }
    }
    // Fall through to metascraper if API fails
  }

  // Try generic oEmbed discovery for other platforms (Vimeo, Spotify, etc.)
  const oembedMetadata = await extractOEmbedMetadata(url)
  if (oembedMetadata) {
    logger.debug('Extracted oEmbed metadata', { url })
    return { ...oembedMetadata, enrichmentSource: 'oembed' }
  }

  // Fallback to metascraper for regular articles and unsupported platforms
  return extractWithMetascraper(url)
}

export function getDomainFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}
