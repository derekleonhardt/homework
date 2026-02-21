import { describe, expect, it } from 'vitest'
import { classifyUrl, parseInput } from '../input-parser'

describe('classifyUrl', () => {
  describe('video detection', () => {
    it('detects YouTube', () => {
      expect(classifyUrl('https://youtube.com/watch?v=abc')).toBe('video')
      expect(classifyUrl('https://youtu.be/abc')).toBe('video')
    })

    it('detects Vimeo', () => {
      expect(classifyUrl('https://vimeo.com/123')).toBe('video')
    })

    it('detects Twitch', () => {
      expect(classifyUrl('https://twitch.tv/stream')).toBe('video')
    })

    it('is case insensitive', () => {
      expect(classifyUrl('https://YOUTUBE.COM/watch')).toBe('video')
    })
  })

  describe('post detection', () => {
    it('detects twitter.com', () => {
      expect(classifyUrl('https://twitter.com/user/status/123')).toBe('post')
    })

    it('detects x.com', () => {
      expect(classifyUrl('https://x.com/user/status/123')).toBe('post')
    })
  })

  describe('podcast detection', () => {
    it('detects Spotify episodes', () => {
      expect(classifyUrl('https://spotify.com/episode/abc')).toBe('podcast')
    })

    it('does NOT detect Spotify tracks', () => {
      expect(classifyUrl('https://spotify.com/track/abc')).toBe('article')
    })

    it('detects Apple Podcasts', () => {
      expect(classifyUrl('https://podcasts.apple.com/podcast/123')).toBe('podcast')
    })

    it('detects Overcast', () => {
      expect(classifyUrl('https://overcast.fm/+abc')).toBe('podcast')
    })
  })

  describe('article fallback', () => {
    it('returns article for unknown URLs', () => {
      expect(classifyUrl('https://medium.com/article')).toBe('article')
      expect(classifyUrl('https://example.com')).toBe('article')
    })
  })

  describe('edge cases', () => {
    it('handles URLs with complex query params', () => {
      expect(classifyUrl('https://youtube.com/watch?v=abc&list=123&t=45')).toBe('video')
      expect(classifyUrl('https://twitter.com/user/status/123?ref=home')).toBe('post')
    })

    it('handles URLs with fragments', () => {
      expect(classifyUrl('https://vimeo.com/123#t=30s')).toBe('video')
    })

    it('handles mixed case domains', () => {
      expect(classifyUrl('https://Twitter.Com/user')).toBe('post')
      expect(classifyUrl('https://SPOTIFY.COM/EPISODE/abc')).toBe('podcast')
    })

    it('handles subdomains correctly', () => {
      expect(classifyUrl('https://m.youtube.com/watch')).toBe('video')
      expect(classifyUrl('https://mobile.twitter.com/user')).toBe('post')
    })

    it('matches domain anywhere in URL (known limitation)', () => {
      // uses includes() so domain in path also matches - acceptable tradeoff for simplicity
      expect(classifyUrl('https://example.com/youtube.com/fake')).toBe('video')
    })
  })
})

describe('parseInput', () => {
  describe('URL detection', () => {
    it('parses http URLs', () => {
      const result = parseInput('http://example.com')
      expect(result.contentType).toBe('article')
      expect('url' in result && result.url).toBe('http://example.com')
    })

    it('parses https URLs', () => {
      const result = parseInput('https://youtube.com/watch?v=abc')
      expect(result.contentType).toBe('video')
    })

    it('trims whitespace', () => {
      const result = parseInput('  https://example.com  ')
      expect('url' in result && result.url).toBe('https://example.com')
    })
  })

  describe('book detection', () => {
    it('detects "book Title" prefix', () => {
      const result = parseInput('book The Great Gatsby')
      expect(result.contentType).toBe('book')
      expect('title' in result && result.title).toBe('The Great Gatsby')
      expect('author' in result && result.author).toBe(null)
    })

    it('detects "Title book" postfix', () => {
      const result = parseInput('The Great Gatsby book')
      expect(result.contentType).toBe('book')
      expect('title' in result && result.title).toBe('The Great Gatsby')
    })

    it('detects "Title by Author"', () => {
      const result = parseInput('The Great Gatsby by F. Scott Fitzgerald')
      expect(result.contentType).toBe('book')
      expect('title' in result && result.title).toBe('The Great Gatsby')
      expect('author' in result && result.author).toBe('F. Scott Fitzgerald')
    })

    it('detects quoted title "Title" by Author', () => {
      const result = parseInput('"1984" by George Orwell')
      expect(result.contentType).toBe('book')
      expect('title' in result && result.title).toBe('1984')
      expect('author' in result && result.author).toBe('George Orwell')
    })

    it('detects "Title, Author" format', () => {
      const result = parseInput('Dune, Frank Herbert')
      expect(result.contentType).toBe('book')
      expect('title' in result && result.title).toBe('Dune')
      expect('author' in result && result.author).toBe('Frank Herbert')
    })

    it('detects "Title - Author" format', () => {
      const result = parseInput('Dune - Frank Herbert')
      expect(result.contentType).toBe('book')
    })
  })

  describe('note fallback', () => {
    it('treats plain text as note', () => {
      const result = parseInput('Remember to buy milk')
      expect(result.contentType).toBe('note')
      expect('text' in result && result.text).toBe('Remember to buy milk')
    })

    it('throws on empty input', () => {
      expect(() => parseInput('')).toThrow('Input cannot be empty')
      expect(() => parseInput('   ')).toThrow('Input cannot be empty')
    })
  })
})
