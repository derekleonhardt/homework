import * as cheerio from 'cheerio'
import type { BaseExtractedMetadata } from '../extractor'

const FETCH_TIMEOUT_MS = 10_000

// Known oEmbed providers with their endpoint patterns
// These are providers where we know the oEmbed endpoint without needing to discover it
const KNOWN_OEMBED_PROVIDERS: Array<{
  pattern: RegExp
  endpoint: string
  name: string
}> = [
  {
    pattern: /vimeo\.com\/(\d+)/,
    endpoint: 'https://vimeo.com/api/oembed.json',
    name: 'Vimeo',
  },
  {
    pattern: /spotify\.com\/(track|album|playlist|episode|show)/,
    endpoint: 'https://open.spotify.com/oembed',
    name: 'Spotify',
  },
  {
    pattern: /soundcloud\.com\//,
    endpoint: 'https://soundcloud.com/oembed',
    name: 'SoundCloud',
  },
  {
    pattern: /instagram\.com\/(p|reel|tv)\//,
    endpoint: 'https://api.instagram.com/oembed',
    name: 'Instagram',
  },
  {
    pattern: /tiktok\.com\/@[\w.-]+\/video\/\d+/,
    endpoint: 'https://www.tiktok.com/oembed',
    name: 'TikTok',
  },
]

interface OEmbedResponse {
  type?: 'photo' | 'video' | 'link' | 'rich'
  title?: string
  author_name?: string
  author_url?: string
  provider_name?: string
  provider_url?: string
  thumbnail_url?: string
  thumbnail_width?: number
  thumbnail_height?: number
  html?: string
  width?: number
  height?: number
  duration?: number // Some providers include this
}

// Find oEmbed endpoint from known providers
function findKnownOEmbedEndpoint(url: string): { endpoint: string; name: string } | null {
  for (const provider of KNOWN_OEMBED_PROVIDERS) {
    if (provider.pattern.test(url)) {
      return { endpoint: provider.endpoint, name: provider.name }
    }
  }
  return null
}

// Discover oEmbed endpoint from page HTML
async function discoverOEmbedEndpoint(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
      redirect: 'follow',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) return null

    const html = await response.text()
    const $ = cheerio.load(html)

    // Look for oEmbed link tags
    // <link rel="alternate" type="application/json+oembed" href="..." />
    const jsonOembedLink = $('link[rel="alternate"][type="application/json+oembed"]').attr('href')
    if (jsonOembedLink) {
      return jsonOembedLink
    }

    // Also check for XML oEmbed (less common but valid)
    const xmlOembedLink = $('link[rel="alternate"][type="text/xml+oembed"]').attr('href')
    if (xmlOembedLink) {
      // We prefer JSON, but can work with XML endpoints
      return xmlOembedLink.replace('format=xml', 'format=json')
    }

    return null
  } catch {
    return null
  }
}

// Fetch and parse oEmbed data
async function fetchOEmbed(oembedUrl: string): Promise<OEmbedResponse | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const response = await fetch(oembedUrl, {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) return null

    return await response.json()
  } catch {
    return null
  }
}

export async function extractOEmbedMetadata(url: string): Promise<BaseExtractedMetadata | null> {
  // First, check if this is a known provider
  const knownProvider = findKnownOEmbedEndpoint(url)

  let oembedUrl: string | null = null
  let providerName: string | null = null

  if (knownProvider) {
    // Use known endpoint
    const endpoint = new URL(knownProvider.endpoint)
    endpoint.searchParams.set('url', url)
    endpoint.searchParams.set('format', 'json')
    oembedUrl = endpoint.toString()
    providerName = knownProvider.name
  } else {
    // Try to discover oEmbed endpoint from the page
    const discoveredEndpoint = await discoverOEmbedEndpoint(url)
    if (discoveredEndpoint) {
      // The discovered endpoint might already include the URL parameter
      if (discoveredEndpoint.includes('url=')) {
        oembedUrl = discoveredEndpoint
      } else {
        const endpoint = new URL(discoveredEndpoint)
        endpoint.searchParams.set('url', url)
        oembedUrl = endpoint.toString()
      }
    }
  }

  if (!oembedUrl) {
    // No oEmbed available for this URL
    return null
  }

  const data = await fetchOEmbed(oembedUrl)
  if (!data) return null

  // Extract site name from provider or URL
  const siteName = providerName || data.provider_name || null

  // For video content, try to estimate duration as reading time
  let readingTime: number | null = null
  if (data.type === 'video' && data.duration) {
    readingTime = Math.ceil(data.duration / 60) // Convert seconds to minutes
  }

  return {
    title: data.title || null,
    description: null, // oEmbed typically doesn't include descriptions
    imageUrl: data.thumbnail_url || null,
    imageWidth: data.thumbnail_width || null,
    imageHeight: data.thumbnail_height || null,
    faviconUrl: data.provider_url ? `${data.provider_url}/favicon.ico` : null,
    siteName,
    author: data.author_name || null,
    publishedAt: null, // oEmbed doesn't include publish dates
    wordCount: null,
    readingTime,
  }
}
