import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { GET } from '../route'

function makeRequest(imageUrl = 'https://cdn.example.com/image.jpg'): Request {
  const search = new URLSearchParams({ url: imageUrl }).toString()
  return {
    nextUrl: new URL(`http://localhost/api/image?${search}`),
    headers: new Headers(),
  } as unknown as Request
}

function streamFromChunks(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk)
      }
      controller.close()
    },
  })
}

describe('GET /api/image body size enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('returns 413 when image body exceeds limit without content-length header', async () => {
    fetchMock.mockResolvedValue(
      new Response(streamFromChunks([new Uint8Array(6_000_000), new Uint8Array(6_000_000)]), {
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
      }),
    )

    const response = await GET(makeRequest() as never)
    const body = (await response.json()) as { error: string }

    expect(response.status).toBe(413)
    expect(body.error).toContain('10MB')
  })

  it('returns 413 when content-length underreports the actual body size', async () => {
    fetchMock.mockResolvedValue(
      new Response(streamFromChunks([new Uint8Array(7_000_000), new Uint8Array(7_000_000)]), {
        status: 200,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': '512',
        },
      }),
    )

    const response = await GET(makeRequest() as never)
    const body = (await response.json()) as { error: string }

    expect(response.status).toBe(413)
    expect(body.error).toContain('10MB')
  })

  it('returns 200 for images within the limit without content-length header', async () => {
    fetchMock.mockResolvedValue(
      new Response(streamFromChunks([new Uint8Array(1_000_000), new Uint8Array(1_000_000)]), {
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
      }),
    )

    const response = await GET(makeRequest() as never)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/jpeg')
    expect((await response.arrayBuffer()).byteLength).toBe(2_000_000)
  })
})
