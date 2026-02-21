import { logger } from '@/lib/logger'
import type { BaseExtractedMetadata } from '../extractor'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3/videos'
const FETCH_TIMEOUT_MS = 10_000

// Extract video ID from various YouTube URL formats
function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.replace('www.', '')

    // youtube.com/watch?v=VIDEO_ID
    if (hostname === 'youtube.com' && parsed.pathname === '/watch') {
      return parsed.searchParams.get('v')
    }

    // youtu.be/VIDEO_ID
    if (hostname === 'youtu.be') {
      return parsed.pathname.slice(1) || null
    }

    // youtube.com/embed/VIDEO_ID
    if (hostname === 'youtube.com' && parsed.pathname.startsWith('/embed/')) {
      return parsed.pathname.replace('/embed/', '').split('/')[0] || null
    }

    // youtube.com/shorts/VIDEO_ID
    if (hostname === 'youtube.com' && parsed.pathname.startsWith('/shorts/')) {
      return parsed.pathname.replace('/shorts/', '').split('/')[0] || null
    }

    // youtube.com/v/VIDEO_ID
    if (hostname === 'youtube.com' && parsed.pathname.startsWith('/v/')) {
      return parsed.pathname.replace('/v/', '').split('/')[0] || null
    }

    return null
  } catch {
    return null
  }
}

export function isYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.replace('www.', '')
    return hostname === 'youtube.com' || hostname === 'youtu.be'
  } catch {
    return false
  }
}

interface YouTubeThumbnail {
  url: string
  width?: number
  height?: number
}

interface YouTubeApiResponse {
  items?: Array<{
    snippet?: {
      title?: string
      description?: string
      channelTitle?: string
      publishedAt?: string
      thumbnails?: {
        maxres?: YouTubeThumbnail
        high?: YouTubeThumbnail
        medium?: YouTubeThumbnail
        default?: YouTubeThumbnail
      }
    }
    contentDetails?: {
      duration?: string // ISO 8601 format, e.g., "PT4M13S"
    }
  }>
}

// Parse ISO 8601 duration to minutes
function parseDurationToMinutes(duration: string): number | null {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return null

  const hours = Number.parseInt(match[1] || '0', 10)
  const minutes = Number.parseInt(match[2] || '0', 10)
  const seconds = Number.parseInt(match[3] || '0', 10)

  return Math.ceil(hours * 60 + minutes + seconds / 60)
}

export async function extractYouTubeMetadata(url: string): Promise<BaseExtractedMetadata | null> {
  const videoId = extractYouTubeVideoId(url)
  if (!videoId) {
    logger.warn('Could not extract video ID from YouTube URL', { url })
    return null
  }

  // Construct thumbnail URLs directly - ONLY use 16:9 formats (no letterboxing)
  // maxresdefault: 1280x720 (not always available)
  // mqdefault: 320x180 (always available, guaranteed 16:9)
  // AVOID hqdefault/sddefault - they're 4:3 with black bars!
  const maxresUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
  const mqUrl = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`

  // Check if maxres exists (not all videos have it)
  let imageUrl = mqUrl // Safe default - always 16:9, no letterbox
  let imageWidth = 320
  let imageHeight = 180

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const maxresCheck = await fetch(maxresUrl, { method: 'HEAD', signal: controller.signal })
    clearTimeout(timeoutId)
    if (maxresCheck.ok) {
      imageUrl = maxresUrl
      imageWidth = 1280
      imageHeight = 720
    }
  } catch {
    // maxres doesn't exist or timeout, stick with mqdefault
  }

  // If API key is configured, fetch full metadata (title, description, etc.)
  const apiKey = process.env.GOOGLE_API_KEY
  if (apiKey) {
    try {
      const apiUrl = new URL(YOUTUBE_API_BASE)
      apiUrl.searchParams.set('part', 'snippet,contentDetails')
      apiUrl.searchParams.set('id', videoId)
      apiUrl.searchParams.set('key', apiKey)

      const apiController = new AbortController()
      const apiTimeoutId = setTimeout(() => apiController.abort(), FETCH_TIMEOUT_MS)
      const response = await fetch(apiUrl.toString(), {
        headers: { Accept: 'application/json' },
        signal: apiController.signal,
      })
      clearTimeout(apiTimeoutId)

      if (response.ok) {
        const data: YouTubeApiResponse = await response.json()
        const video = data.items?.[0]

        if (video?.snippet) {
          const { snippet, contentDetails } = video
          const readingTime = contentDetails?.duration
            ? parseDurationToMinutes(contentDetails.duration)
            : null

          return {
            title: snippet.title || null,
            description: snippet.description?.slice(0, 500) || null,
            imageUrl,
            imageWidth,
            imageHeight,
            faviconUrl: 'https://www.youtube.com/favicon.ico',
            siteName: 'YouTube',
            author: snippet.channelTitle || null,
            publishedAt: snippet.publishedAt || null,
            wordCount: null,
            readingTime,
          }
        }
      }
    } catch (error) {
      logger.error('YouTube API extraction failed', error, { url, videoId })
    }
  }

  // No API key or API failed - return with just the thumbnail (title will come from metascraper fallback)
  return {
    title: null, // Will be filled by metascraper
    description: null,
    imageUrl,
    imageWidth,
    imageHeight,
    faviconUrl: 'https://www.youtube.com/favicon.ico',
    siteName: 'YouTube',
    author: null,
    publishedAt: null,
    wordCount: null,
    readingTime: null,
  }
}
