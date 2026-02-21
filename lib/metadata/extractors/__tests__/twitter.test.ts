import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { extractTwitterMetadata } from '../twitter'

const ARTICLE_URL = 'https://x.com/eyad_khrais/status/2010810802023141688'
const COVER_MEDIA_KEY = '3_2010810614948499457'
const COVER_IMAGE_URL = 'https://pbs.twimg.com/media/cover123.jpg'

function makeArticleResponse({ includesCoverMedia = true }: { includesCoverMedia?: boolean } = {}) {
  return {
    data: {
      id: '2010810802023141688',
      text: 'https://t.co/Drd9T4nCMJ',
      author_id: '123',
      created_at: '2026-01-12T20:27:08.000Z',
      article: {
        title: 'The claude code tutorial level 2',
        preview_text: 'This is the official Claude Code tutorial part 2',
        cover_media: COVER_MEDIA_KEY,
      },
      entities: {
        urls: [
          {
            url: 'https://t.co/Drd9T4nCMJ',
            expanded_url: 'http://x.com/i/article/2010809702980935681',
            display_url: 'x.com/i/article/2010…',
          },
        ],
      },
    },
    includes: {
      users: [
        {
          id: '123',
          name: 'Eyad',
          username: 'eyad_khrais',
          profile_image_url: 'https://pbs.twimg.com/profile_normal.jpg',
        },
      ],
      media: includesCoverMedia
        ? [
            {
              media_key: COVER_MEDIA_KEY,
              type: 'photo',
              url: COVER_IMAGE_URL,
              width: 1200,
              height: 675,
            },
          ]
        : undefined,
    },
  }
}

// biome-ignore lint/suspicious/noExplicitAny: mock helper
function mockFetchSuccess(body: any) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(body),
    // biome-ignore lint/suspicious/noExplicitAny: partial Response mock
  } as any)
}

describe('extractTwitterMetadata', () => {
  beforeEach(() => {
    vi.stubEnv('X_API_TOKEN', 'test-token')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('requests article.cover_media expansion from X API', async () => {
    const fetchSpy = mockFetchSuccess(makeArticleResponse())

    await extractTwitterMetadata(ARTICLE_URL)

    const calledUrl = new URL(fetchSpy.mock.calls[0][0] as string)
    const expansions = calledUrl.searchParams.get('expansions')
    expect(expansions).toContain('article.cover_media')
  })

  it('uses article cover image when available', async () => {
    mockFetchSuccess(makeArticleResponse({ includesCoverMedia: true }))

    const result = await extractTwitterMetadata(ARTICLE_URL)

    expect(result?.imageUrl).toBe(COVER_IMAGE_URL)
    expect(result?.imageWidth).toBe(1200)
    expect(result?.imageHeight).toBe(675)
  })

  it('falls back to profile photo when cover media missing', async () => {
    mockFetchSuccess(makeArticleResponse({ includesCoverMedia: false }))

    const result = await extractTwitterMetadata(ARTICLE_URL)

    expect(result?.imageUrl).toBe('https://pbs.twimg.com/profile_400x400.jpg')
  })

  it('returns article title and description', async () => {
    mockFetchSuccess(makeArticleResponse())

    const result = await extractTwitterMetadata(ARTICLE_URL)

    expect(result?.title).toBe('The claude code tutorial level 2')
    expect(result?.description).toBe('This is the official Claude Code tutorial part 2')
  })
})
