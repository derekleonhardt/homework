import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { enrichItem } from '../enrich'

// Mock all dependencies
vi.mock('@/lib/db', () => ({
  withTx: vi.fn((fn: (tx: unknown) => unknown) =>
    fn({
      item: {
        update: vi.fn().mockResolvedValue({}),
      },
    }),
  ),
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../extractor', () => ({
  extractMetadata: vi.fn().mockResolvedValue({
    title: 'Test Video',
    description: null,
    imageUrl: null,
    imageWidth: null,
    imageHeight: null,
    faviconUrl: null,
    siteName: 'YouTube',
    author: null,
    publishedAt: null,
    wordCount: null,
    readingTime: null,
    enrichmentSource: 'metascraper',
    typeOverride: undefined,
  }),
}))

vi.mock('../auto-tagger', () => ({
  generateAutoTags: vi.fn().mockReturnValue([]),
}))

vi.mock('../apply-tags', () => ({
  applyTags: vi.fn(),
}))

describe('enrichItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns aiTagInput with classifyUrl result as type for YouTube URLs', async () => {
    const result = await enrichItem('item-1', 'https://youtube.com/watch?v=abc')

    expect(result).toEqual(
      expect.objectContaining({
        aiTagInput: expect.objectContaining({ type: 'video' }),
      }),
    )
  })

  it('returns aiTagInput with classifyUrl result as type for Twitter URLs', async () => {
    const result = await enrichItem('item-1', 'https://twitter.com/user/status/123')

    expect(result).toEqual(
      expect.objectContaining({
        aiTagInput: expect.objectContaining({ type: 'post' }),
      }),
    )
  })

  it('uses typeOverride when present instead of classifyUrl', async () => {
    const { extractMetadata } = await import('../extractor')
    ;(extractMetadata as Mock).mockResolvedValueOnce({
      title: 'Long Twitter Article',
      description: null,
      imageUrl: null,
      imageWidth: null,
      imageHeight: null,
      faviconUrl: null,
      siteName: 'X',
      author: null,
      publishedAt: null,
      wordCount: null,
      readingTime: null,
      enrichmentSource: 'twitter',
      typeOverride: 'article',
    })

    const result = await enrichItem('item-1', 'https://x.com/user/status/123')

    expect(result).toEqual(
      expect.objectContaining({
        aiTagInput: expect.objectContaining({ type: 'article' }),
      }),
    )
  })

  it('returns undefined on enrichment failure', async () => {
    const { extractMetadata } = await import('../extractor')
    ;(extractMetadata as Mock).mockRejectedValueOnce(new Error('network error'))

    const result = await enrichItem('item-1', 'https://example.com')

    expect(result).toBeUndefined()
  })
})
