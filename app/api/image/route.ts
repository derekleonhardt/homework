import { isIP } from 'node:net'
import { logger } from '@/lib/logger'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const MAX_IMAGE_SIZE = 10_000_000 // 10MB
const FETCH_TIMEOUT_MS = 10_000

async function readBodyWithLimit(
  body: ReadableStream<Uint8Array>,
  maxBytes: number,
): Promise<Uint8Array | null> {
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue

      totalBytes += value.byteLength
      if (totalBytes > maxBytes) {
        await reader.cancel('Image exceeds max size')
        return null
      }

      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const output = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.byteLength
  }

  return output
}

function bytesToReadableStream(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
}

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^www\./, '').toLowerCase()
}

function isLoopbackHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname)
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '0.0.0.0' ||
    normalized.endsWith('.localhost')
  )
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map((part) => Number.parseInt(part, 10))
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false
  }

  const [a, b] = parts

  if (a === 10 || a === 127 || a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true

  return false
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  if (normalized === '::1') return true
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true // fc00::/7
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9')) return true // fe80::/10
  if (normalized.startsWith('fea') || normalized.startsWith('feb')) return true // fe80::/10
  return false
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname)

  if (isLoopbackHostname(normalized) || normalized.endsWith('.local')) {
    return true
  }

  const ipVersion = isIP(normalized)
  if (ipVersion === 4) {
    return isPrivateIpv4(normalized)
  }
  if (ipVersion === 6) {
    return isPrivateIpv6(normalized)
  }

  return false
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url')
  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url query parameter' }, { status: 400 })
  }

  let targetUrl: URL
  try {
    targetUrl = new URL(rawUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (targetUrl.protocol !== 'https:' && targetUrl.protocol !== 'http:') {
    return NextResponse.json({ error: 'Only HTTP(S) URLs are allowed' }, { status: 400 })
  }

  if (isBlockedHostname(targetUrl.hostname)) {
    return NextResponse.json({ error: 'Blocked host' }, { status: 403 })
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const upstream = await (async () => {
      try {
        return await fetch(targetUrl.toString(), {
          headers: {
            Accept: 'image/*,*/*;q=0.8',
            'User-Agent': 'HomeworkBot/1.0',
          },
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeoutId)
      }
    })()

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
    }

    const contentType = upstream.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Upstream did not return an image' }, { status: 415 })
    }

    const contentLength = upstream.headers.get('content-length')
    if (contentLength && Number.parseInt(contentLength, 10) > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image exceeds 10MB limit' }, { status: 413 })
    }

    const bodyBytes = await readBodyWithLimit(upstream.body, MAX_IMAGE_SIZE)
    if (!bodyBytes) {
      return NextResponse.json({ error: 'Image exceeds 10MB limit' }, { status: 413 })
    }

    const headers = new Headers()
    headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
    headers.set('Content-Type', contentType)
    headers.set('X-Content-Type-Options', 'nosniff')

    return new NextResponse(bytesToReadableStream(bodyBytes), {
      status: 200,
      headers,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Image fetch timeout' }, { status: 504 })
    }

    logger.warn('Image proxy request failed', {
      host: targetUrl.hostname,
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Image proxy request failed' }, { status: 502 })
  }
}
