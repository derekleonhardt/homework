import { describe, expect, it } from 'vitest'
import { generateAutoTags, getTagColor } from '../auto-tagger'
import type { ExtractedMetadata } from '../extractor'

// Helper to create minimal metadata
const emptyMetadata: ExtractedMetadata = {
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

describe('generateAutoTags', () => {
  it('adds content type tag', () => {
    const tags = generateAutoTags('https://example.com/article', emptyMetadata)
    expect(tags.some((t) => t.slug === 'article')).toBe(true)
  })

  it('adds video type for YouTube', () => {
    const tags = generateAutoTags('https://youtube.com/watch?v=abc', emptyMetadata)
    expect(tags.some((t) => t.slug === 'video')).toBe(true)
  })

  it('adds domain tag for known domains', () => {
    const tags = generateAutoTags('https://youtube.com/watch?v=abc', emptyMetadata)
    expect(tags.some((t) => t.slug === 'youtube')).toBe(true)
  })

  it('does not add siteName as tag (redundant with item.siteName)', () => {
    const tags = generateAutoTags('https://unknown-site.com', {
      ...emptyMetadata,
      siteName: 'My Cool Blog',
    })
    expect(tags.some((t) => t.slug === 'my-cool-blog')).toBe(false)
  })

  it('uses typeOverride when present', () => {
    const tags = generateAutoTags('https://x.com/user/status/123', {
      ...emptyMetadata,
      typeOverride: 'article',
    })
    expect(tags.some((t) => t.slug === 'article')).toBe(true)
    expect(tags.some((t) => t.slug === 'post')).toBe(false)
  })

  it('falls back to URL classification without typeOverride', () => {
    const tags = generateAutoTags('https://twitter.com/user/status/123', emptyMetadata)
    expect(tags.some((t) => t.slug === 'post')).toBe(true)
  })

  it('does not duplicate type+domain for same URL', () => {
    const tags = generateAutoTags('https://twitter.com/user/status/123', emptyMetadata)
    const slugs = tags.map((t) => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('handles subdomain matching', () => {
    const tags = generateAutoTags('https://news.ycombinator.com/item?id=123', emptyMetadata)
    expect(tags.some((t) => t.slug === 'hacker-news')).toBe(true)
  })
})

describe('getTagColor', () => {
  it('returns color for type tags', () => {
    expect(getTagColor('video')).toBe('#EF4444')
    expect(getTagColor('article')).toBe('#6B7280')
  })

  it('returns color for domain tags', () => {
    expect(getTagColor('youtube')).toBe('#FF0000')
  })

  it('returns default for unknown slug', () => {
    expect(getTagColor('unknown-tag')).toBe('#6B7280')
  })
})
