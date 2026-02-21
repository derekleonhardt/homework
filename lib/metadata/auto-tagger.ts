import { classifyUrl } from '../input-parser'
import { type ExtractedMetadata, getDomainFromUrl } from './extractor'

export interface AutoTag {
  name: string
  slug: string
  color: string
}

const DOMAIN_TAGS: Record<string, AutoTag> = {
  'youtube.com': { name: 'YouTube', slug: 'youtube', color: '#FF0000' },
  'medium.com': { name: 'Medium', slug: 'medium', color: '#000000' },
  'substack.com': { name: 'Substack', slug: 'substack', color: '#FF6719' },
  'github.com': { name: 'GitHub', slug: 'github', color: '#24292F' },
  'twitter.com': { name: 'Twitter', slug: 'twitter', color: '#1DA1F2' },
  'x.com': { name: 'X', slug: 'x', color: '#000000' },
  'reddit.com': { name: 'Reddit', slug: 'reddit', color: '#FF4500' },
  'nytimes.com': { name: 'NY Times', slug: 'nytimes', color: '#000000' },
  'theverge.com': { name: 'The Verge', slug: 'the-verge', color: '#E4105D' },
  'techcrunch.com': { name: 'TechCrunch', slug: 'techcrunch', color: '#0A9952' },
  'arstechnica.com': { name: 'Ars Technica', slug: 'ars-technica', color: '#FF4E00' },
  'hackernews.com': { name: 'Hacker News', slug: 'hacker-news', color: '#FF6600' },
  'news.ycombinator.com': { name: 'Hacker News', slug: 'hacker-news', color: '#FF6600' },
  'stackoverflow.com': { name: 'Stack Overflow', slug: 'stack-overflow', color: '#F48024' },
  'dev.to': { name: 'DEV', slug: 'dev-to', color: '#0A0A0A' },
  'notion.so': { name: 'Notion', slug: 'notion', color: '#000000' },
  'figma.com': { name: 'Figma', slug: 'figma', color: '#F24E1E' },
  'dribbble.com': { name: 'Dribbble', slug: 'dribbble', color: '#EA4C89' },
  'spotify.com': { name: 'Spotify', slug: 'spotify', color: '#1DB954' },
  'podcasts.apple.com': { name: 'Apple Podcasts', slug: 'apple-podcasts', color: '#9933FF' },
  'vimeo.com': { name: 'Vimeo', slug: 'vimeo', color: '#1AB7EA' },
  'twitch.tv': { name: 'Twitch', slug: 'twitch', color: '#9146FF' },
  'linkedin.com': { name: 'LinkedIn', slug: 'linkedin', color: '#0A66C2' },
  'wikipedia.org': { name: 'Wikipedia', slug: 'wikipedia', color: '#000000' },
}

const TYPE_TAGS: Record<string, AutoTag> = {
  article: { name: 'Article', slug: 'article', color: '#6B7280' },
  video: { name: 'Video', slug: 'video', color: '#EF4444' },
  post: { name: 'Post', slug: 'post', color: '#3B82F6' },
  podcast: { name: 'Podcast', slug: 'podcast', color: '#8B5CF6' },
}

function getDomainTag(domain: string): AutoTag | null {
  // Check exact match first
  if (DOMAIN_TAGS[domain]) {
    return DOMAIN_TAGS[domain]
  }

  // Check if domain ends with any known domain (for subdomains)
  for (const [knownDomain, tag] of Object.entries(DOMAIN_TAGS)) {
    if (domain.endsWith(`.${knownDomain}`) || domain === knownDomain) {
      return tag
    }
  }

  return null
}

export function generateAutoTags(url: string, metadata: ExtractedMetadata): AutoTag[] {
  const tags: AutoTag[] = []
  const seenSlugs = new Set<string>()

  // 1. Content type tag (prefer enrichment-detected type over URL classification)
  const contentType = metadata.typeOverride ?? classifyUrl(url)
  const typeTag = TYPE_TAGS[contentType]
  if (typeTag && !seenSlugs.has(typeTag.slug)) {
    tags.push(typeTag)
    seenSlugs.add(typeTag.slug)
  }

  // 2. Domain/source tag
  const domain = getDomainFromUrl(url)
  if (domain) {
    const domainTag = getDomainTag(domain)
    if (domainTag && !seenSlugs.has(domainTag.slug)) {
      tags.push(domainTag)
      seenSlugs.add(domainTag.slug)
    }
  }

  return tags
}

export function getTagColor(slug: string): string {
  // Check type tags
  for (const tag of Object.values(TYPE_TAGS)) {
    if (tag.slug === slug) return tag.color
  }

  // Check domain tags
  for (const tag of Object.values(DOMAIN_TAGS)) {
    if (tag.slug === slug) return tag.color
  }

  // Default color
  return '#6B7280'
}
