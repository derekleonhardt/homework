/**
 * Input Parser
 *
 * Parses user input and classifies content type.
 * Handles: URLs, book patterns, and plain text.
 */

import type { ContentType } from './types'

type UrlContentType = Extract<ContentType, 'article' | 'video' | 'post' | 'podcast'>

type ParsedInput =
  | { contentType: UrlContentType; url: string }
  | { contentType: 'book'; title: string; author: string | null }
  | { contentType: 'note'; text: string }

// URL pattern matching
const VIDEO_DOMAINS = ['youtube.com', 'youtu.be', 'vimeo.com', 'twitch.tv']
const SOCIAL_DOMAINS = ['twitter.com', 'x.com']
const PODCAST_PATTERNS = [
  'spotify.com/episode',
  'podcasts.apple.com',
  'overcast.fm',
  'pocketcasts.com',
]

export function classifyUrl(url: string): UrlContentType {
  const urlLower = url.toLowerCase()

  if (VIDEO_DOMAINS.some((d) => urlLower.includes(d))) return 'video'
  if (SOCIAL_DOMAINS.some((d) => urlLower.includes(d))) return 'post'
  if (PODCAST_PATTERNS.some((p) => urlLower.includes(p))) return 'podcast'

  return 'article'
}

/**
 * Parse user input and classify its content type.
 *
 * Priority:
 * 1. URL - starts with http:// or https:// → video/post/podcast/article
 * 2. Book - patterns like "Title by Author" or "book" prefix / postfix → book
 * 3. Text - everything else → note
 */
export function parseInput(input: string): ParsedInput {
  const trimmed = input.trim()

  if (!trimmed) {
    throw new Error('Input cannot be empty')
  }

  // 1. URL detection
  if (/^https?:\/\//i.test(trimmed)) {
    return { contentType: classifyUrl(trimmed), url: trimmed }
  }

  // 2. Book pattern detection
  const bookMatch = parseBookPattern(trimmed)
  if (bookMatch) {
    return { contentType: 'book', ...bookMatch }
  }

  // 3. Plain text → note
  return { contentType: 'note', text: trimmed }
}

/**
 * Try to parse input as a book reference.
 *
 * Patterns:
 * - book Title (explicit prefix/postfix)
 * - "Title" by Author
 * - Title by Author
 * - Title, Author
 * - Title - Author
 */
function parseBookPattern(input: string): { title: string; author: string | null } | null {
  // Pattern 0: explicit "book" keyword
  const bookPrefixMatch = input.match(/^book\s+(.+)$/i)
  const bookPostfixMatch = input.match(/^(.+)\s+book$/i)
  const bookMatch = bookPrefixMatch?.[1] || bookPostfixMatch?.[1]
  if (bookMatch) {
    const title = bookMatch.trim()
    if (isValidBookPart(title)) {
      return { title, author: null }
    }
  }

  // Pattern 1: "Title" by Author (quoted)
  const quotedByMatch = input.match(/^[""](.+?)[""]?\s+by\s+(.+)$/i)
  if (quotedByMatch) {
    const title = quotedByMatch[1].trim()
    const author = quotedByMatch[2].trim()
    if (isValidBookPart(title) && isValidBookPart(author)) {
      return { title, author }
    }
  }

  // Pattern 2: Title by Author (unquoted)
  const byMatch = input.match(/^(.+?)\s+by\s+(.+)$/i)
  if (byMatch) {
    const title = byMatch[1].trim()
    const author = byMatch[2].trim()
    if (isValidBookPart(title) && isValidBookPart(author)) {
      return { title, author }
    }
  }

  // Pattern 3: Title, Author (comma-separated, single comma only)
  const parts = input.split(',')
  if (parts.length === 2) {
    const title = parts[0].trim()
    const author = parts[1].trim()
    if (isValidBookPart(title) && isValidBookPart(author) && looksLikeAuthorName(author)) {
      return { title, author }
    }
  }

  // Pattern 4: Title - Author (dash-separated)
  const dashMatch = input.match(/^(.+?)\s+-\s+(.+)$/)
  if (dashMatch) {
    const title = dashMatch[1].trim()
    const author = dashMatch[2].trim()
    if (isValidBookPart(title) && isValidBookPart(author) && looksLikeAuthorName(author)) {
      return { title, author }
    }
  }

  return null
}

function isValidBookPart(str: string): boolean {
  return str.length >= 2 && /\w/.test(str)
}

function looksLikeAuthorName(str: string): boolean {
  if (/[\/\\@#]/.test(str)) return false
  if (/^(the|a|an|and|or|but|in|on|at|to|for)\s/i.test(str)) return false

  const words = str.split(/\s+/).filter((w) => w.length > 0)
  if (words.length >= 2) return true
  if (words.length === 1 && /^[A-Z]/.test(words[0])) return true

  return false
}
