import { logger } from '@/lib/logger'
import type { BaseExtractedMetadata } from '../extractor'

const X_API_BASE = 'https://api.twitter.com/2'
const FETCH_TIMEOUT_MS = 10_000

export function isTwitterUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.replace('www.', '')
    return hostname === 'twitter.com' || hostname === 'x.com'
  } catch {
    return false
  }
}

function extractTweetId(url: string): string | null {
  try {
    const parsed = new URL(url)
    // Pattern: twitter.com/username/status/TWEET_ID or x.com/username/status/TWEET_ID
    const match = parsed.pathname.match(/\/status\/(\d+)/)
    return match?.[1] || null
  } catch {
    return null
  }
}

interface XApiTweet {
  id: string
  text: string
  author_id: string
  created_at?: string
  // Article metadata for Twitter Articles
  article?: {
    title?: string
    description?: string
    preview_text?: string
    cover_media?: string // Media key for the cover image
  }
  // Note tweets contain longer content (long tweets >280 chars)
  note_tweet?: {
    text: string
    entities?: {
      urls?: Array<{
        url: string
        expanded_url: string
        display_url: string
      }>
    }
  }
  entities?: {
    urls?: Array<{
      url: string
      expanded_url: string
      display_url: string
      title?: string
      description?: string
    }>
  }
  attachments?: {
    media_keys?: string[]
  }
}

interface XApiUser {
  id: string
  name: string
  username: string
  profile_image_url?: string
}

interface XApiMedia {
  media_key: string
  type: string
  url?: string
  preview_image_url?: string
  width?: number
  height?: number
}

interface XApiResponse {
  data?: XApiTweet
  includes?: {
    users?: XApiUser[]
    media?: XApiMedia[]
  }
  errors?: Array<{
    detail: string
    title: string
    type: string
  }>
}

export async function extractTwitterMetadata(url: string): Promise<BaseExtractedMetadata | null> {
  const bearerToken = process.env.X_API_TOKEN

  if (!bearerToken) {
    logger.debug('X_API_TOKEN not set, skipping X API extraction')
    return null
  }

  const tweetId = extractTweetId(url)
  if (!tweetId) {
    logger.warn('Not a tweet URL (no status ID found)', { url })
    return null
  }

  try {
    // Request tweet with expansions for author info, media, and article metadata
    const apiUrl = new URL(`${X_API_BASE}/tweets/${tweetId}`)
    apiUrl.searchParams.set('expansions', 'author_id,attachments.media_keys,article.cover_media')
    apiUrl.searchParams.set('tweet.fields', 'created_at,entities,note_tweet,article,attachments')
    apiUrl.searchParams.set('user.fields', 'name,username,profile_image_url')
    apiUrl.searchParams.set('media.fields', 'url,preview_image_url,type,width,height')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const response = await fetch(apiUrl.toString(), {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 401) {
        logger.warn('X API authentication failed - check your bearer token')
      } else if (response.status === 404) {
        logger.warn('Tweet not found', { url })
      } else {
        logger.warn('X API error', { status: response.status, url })
      }
      return null
    }

    const data: XApiResponse = await response.json()

    if (data.errors) {
      logger.warn('X API returned errors', { errors: data.errors, url })
      return null
    }

    if (!data.data) {
      logger.warn('X API returned no tweet data', { url })
      return null
    }

    const tweet = data.data
    const author = data.includes?.users?.find((u) => u.id === tweet.author_id)

    // Get author's profile image in larger size for better quality
    const authorImageUrl = author?.profile_image_url?.replace('_normal', '_400x400') || null

    // Get the first media attachment with URL and dimensions
    const getMediaInfo = (): {
      url: string | null
      width: number | null
      height: number | null
    } => {
      if (!tweet.attachments?.media_keys?.length || !data.includes?.media?.length) {
        return { url: null, width: null, height: null }
      }
      const firstMediaKey = tweet.attachments.media_keys[0]
      const media = data.includes.media.find((m) => m.media_key === firstMediaKey)
      if (!media) return { url: null, width: null, height: null }
      // For photos, use url; for videos, use preview_image_url
      return {
        url: media.url || media.preview_image_url || null,
        width: media.width || null,
        height: media.height || null,
      }
    }

    // Determine site name based on URL
    const isX = url.includes('x.com')
    const siteName = isX ? 'X' : 'Twitter'
    const handle = author ? `@${author.username}` : null
    const mediaInfo = getMediaInfo()

    // Twitter Articles have dedicated title/description
    if (tweet.article?.title) {
      let articleImageUrl: string | null = null
      let articleImageWidth: number | null = null
      let articleImageHeight: number | null = null

      if (tweet.article.cover_media && data.includes?.media) {
        const coverMedia = data.includes.media.find(
          (m) => m.media_key === tweet.article?.cover_media,
        )
        articleImageUrl = coverMedia?.url || coverMedia?.preview_image_url || null
        articleImageWidth = coverMedia?.width || null
        articleImageHeight = coverMedia?.height || null
      }

      return {
        title: tweet.article.title,
        description: tweet.article.preview_text || tweet.article.description || null,
        imageUrl: articleImageUrl || mediaInfo.url || authorImageUrl,
        imageWidth: articleImageUrl ? articleImageWidth : mediaInfo.url ? mediaInfo.width : null,
        imageHeight: articleImageUrl ? articleImageHeight : mediaInfo.url ? mediaInfo.height : null,
        faviconUrl: isX ? 'https://x.com/favicon.ico' : 'https://twitter.com/favicon.ico',
        siteName,
        author: handle || null,
        publishedAt: tweet.created_at || null,
        wordCount: null,
        readingTime: null,
      }
    }

    // Prefer note_tweet (long tweets) over regular text
    let tweetText = tweet.note_tweet?.text || tweet.text

    // Replace t.co URLs with expanded URLs
    const entities = tweet.note_tweet?.entities || tweet.entities
    if (entities?.urls) {
      for (const urlEntity of entities.urls) {
        tweetText = tweetText.replace(urlEntity.url, urlEntity.expanded_url)
      }
    }

    // Create title from tweet text (first line, max 200 chars)
    const titleText = tweetText.split('\n')[0] || tweetText
    const title = titleText.length > 200 ? `${titleText.slice(0, 197)}...` : titleText

    return {
      title: title || null,
      description: tweetText || null,
      imageUrl: mediaInfo.url || authorImageUrl,
      imageWidth: mediaInfo.url ? mediaInfo.width : null,
      imageHeight: mediaInfo.url ? mediaInfo.height : null,
      faviconUrl: isX ? 'https://x.com/favicon.ico' : 'https://twitter.com/favicon.ico',
      siteName,
      author: handle || null,
      publishedAt: tweet.created_at || null,
      wordCount: null,
      readingTime: 1, // Regular tweets are quick reads
    }
  } catch (error) {
    logger.error('X API extraction failed', error, { url })
    return null
  }
}
