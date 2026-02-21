import type { Item } from './types'

const HIDDEN_TAG_SLUGS = new Set([
  // Type tags
  'article',
  'video',
  'post',
  'podcast',
  // Domain tags
  'youtube',
  'medium',
  'substack',
  'github',
  'twitter',
  'x',
  'reddit',
  'nytimes',
  'the-verge',
  'techcrunch',
  'ars-technica',
  'hacker-news',
  'stack-overflow',
  'dev-to',
  'notion',
  'figma',
  'dribbble',
  'spotify',
  'apple-podcasts',
  'vimeo',
  'twitch',
  'linkedin',
  'wikipedia',
])

export interface TopicTag {
  name: string
  slug: string
  color: string
}

export function getTopicTags(item: Item): TopicTag[] {
  if (!item.tags) return []
  const siteNameLower = item.siteName?.toLowerCase()
  return item.tags
    .map((it) => it.tag)
    .filter((t) => !HIDDEN_TAG_SLUGS.has(t.slug) && t.name.toLowerCase() !== siteNameLower)
}
