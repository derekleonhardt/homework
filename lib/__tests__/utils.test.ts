import { describe, expect, it } from 'vitest'
import { cn, formatRelativeDate, getCardImageSrc, getContentGradient, getDomain } from '../utils'

describe('cn', () => {
  it('merges multiple classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolves Tailwind conflicts (later wins)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('filters falsy values', () => {
    expect(cn('foo', false, null, undefined, 'bar')).toBe('foo bar')
  })

  it('handles conditional objects', () => {
    expect(cn({ 'bg-red-500': true, 'bg-blue-500': false })).toBe('bg-red-500')
  })

  it('returns empty string for no args', () => {
    expect(cn()).toBe('')
  })
})

describe('getDomain', () => {
  it('extracts domain from valid URL', () => {
    expect(getDomain('https://example.com/path')).toBe('example.com')
  })

  it('strips www prefix', () => {
    expect(getDomain('https://www.example.com')).toBe('example.com')
  })

  it('preserves subdomains', () => {
    expect(getDomain('https://blog.example.com')).toBe('blog.example.com')
  })

  it('ignores port and query', () => {
    expect(getDomain('http://example.com:8080/path?q=1')).toBe('example.com')
  })

  it('returns input for invalid URL', () => {
    expect(getDomain('not-a-url')).toBe('not-a-url')
  })

  it('handles empty string', () => {
    expect(getDomain('')).toBe('')
  })

  it('returns input for protocol-relative URLs (parse fails)', () => {
    // URL constructor fails on protocol-relative URLs, so input is returned
    expect(getDomain('//example.com/path')).toBe('//example.com/path')
  })
})

describe('formatRelativeDate', () => {
  it('returns Today for same day', () => {
    const now = new Date().toISOString()
    expect(formatRelativeDate(now)).toBe('Today')
  })

  it('returns Yesterday for 1 day ago', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeDate(yesterday)).toBe('Yesterday')
  })

  it('returns Xd ago for 2-6 days', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeDate(threeDaysAgo)).toBe('3d ago')
  })

  it('returns Xw ago for 7-29 days', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeDate(twoWeeksAgo)).toBe('2w ago')
  })

  it('returns formatted date for 30+ days', () => {
    const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const result = formatRelativeDate(oldDate)
    // Should be locale-formatted like "Dec 2" not relative
    expect(result).not.toContain('ago')
    expect(result).not.toBe('Today')
  })
})

describe('getContentGradient', () => {
  it('returns gradient for known types', () => {
    expect(getContentGradient('article')).toContain('linear-gradient')
    expect(getContentGradient('video')).toContain('linear-gradient')
    expect(getContentGradient('podcast')).toContain('linear-gradient')
  })

  it('is case insensitive', () => {
    expect(getContentGradient('ARTICLE')).toBe(getContentGradient('article'))
    expect(getContentGradient('Video')).toBe(getContentGradient('video'))
  })

  it('returns default for unknown type', () => {
    const defaultGradient = getContentGradient('unknown')
    expect(defaultGradient).toContain('linear-gradient')
    expect(getContentGradient('')).toBe(defaultGradient)
  })
})

describe('getCardImageSrc', () => {
  it('proxies HTTPS image URLs', () => {
    const imageUrl =
      'https://pbs.twimg.com/amplify_video_thumb/2020606162723356673/img/UMfrFj7QDVCwvElV.jpg'
    expect(getCardImageSrc(imageUrl)).toBe(`/api/image?url=${encodeURIComponent(imageUrl)}`)
  })

  it('proxies HTTP image URLs', () => {
    const imageUrl = 'http://cdn.example.com/foo.jpg'
    expect(getCardImageSrc(imageUrl)).toBe(`/api/image?url=${encodeURIComponent(imageUrl)}`)
  })

  it('returns non-http URLs unchanged', () => {
    const imageUrl = 'data:image/png;base64,abc'
    expect(getCardImageSrc(imageUrl)).toBe(imageUrl)
  })

  it('returns invalid URLs unchanged', () => {
    expect(getCardImageSrc('not-a-url')).toBe('not-a-url')
  })
})
