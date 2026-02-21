import { withTx } from '@/lib/db'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import type { ContentType } from '@/lib/types'
import { anthropic } from '@ai-sdk/anthropic'
import { Output, generateText } from 'ai'
import { z } from 'zod'
import { applyTags, fetchTagNames } from './apply-tags'
import type { AutoTag } from './auto-tagger'

export interface AiTagInput {
  title?: string
  author?: string
  description?: string
  siteName?: string
  type: ContentType
  rawInput?: string
}

type AiTagResult = { ok: true; tags: AutoTag[] } | { ok: false; error: string }

const DEFAULT_COLOR = '#6B7280'
const MAX_RAW_INPUT = 1000

const tagSchema = z.object({
  tags: z.array(z.object({ name: z.string() })),
})

const SYSTEM_PROMPT = `You are a topic tagger for a personal read-it-later app. Your job: classify saved content by **subject matter**.

Return 2-5 short, specific topic tags. Think "what shelf would this go on in a library?"

<rules>
- Tags describe WHAT the content is ABOUT, not what FORMAT it is
- Good granularity: "machine-learning", "react", "personal-finance" — not too broad ("technology") or too narrow ("react-usestate-custom-hook-patterns")
- Use lowercase, 1-3 word natural phrases: "distributed systems", "climate change", "rust"
- NEVER return format/medium tags: article, video, podcast, blog, post, book, note, newsletter, tutorial, guide, essay, website, thread
- NEVER return source/platform tags: youtube, twitter, github, medium, substack, reddit
- NEVER return meta tags: interesting, must-read, important, featured, trending
</rules>

<examples>
"How React Server Components Work" by Dan Abramov → react, server-components, web-performance
"YC S24 Batch Analysis" on news.ycombinator.com → startups, venture-capital, yc
"Designing Data-Intensive Applications" by Martin Kleppmann → distributed-systems, databases, system-design
"My sourdough starter recipe with 80% hydration" → cooking, sourdough, fermentation
"The Fed just raised rates again — here's what it means" → economics, federal-reserve, interest-rates
</examples>`

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function buildSystemPrompt(existingTagNames: readonly string[]): string {
  if (existingTagNames.length === 0) return SYSTEM_PROMPT

  return [
    SYSTEM_PROMPT,
    '',
    '<existing_tags>',
    existingTagNames.join(', '),
    '</existing_tags>',
    'When a relevant existing tag fits, reuse it exactly. Only create new tags for topics not covered above.',
  ].join('\n')
}

function buildUserPrompt(input: AiTagInput): string {
  const parts: string[] = []
  if (input.title) parts.push(`Title: ${input.title}`)
  if (input.author) parts.push(`Author: ${input.author}`)
  if (input.description) parts.push(`Description: ${input.description}`)
  if (input.siteName) parts.push(`Site: ${input.siteName}`)
  if (input.rawInput) parts.push(`Content: ${input.rawInput.slice(0, MAX_RAW_INPUT)}`)
  parts.push(`Type: ${input.type}`)
  return parts.join('\n')
}

function deduplicateAndSlugify(raw: readonly { name: string }[]): AutoTag[] {
  const seen = new Set<string>()
  const tags: AutoTag[] = []

  for (const { name } of raw) {
    if (tags.length >= 5) break
    const slug = slugify(name)
    if (slug.length < 2 || seen.has(slug)) continue
    seen.add(slug)
    tags.push({ name, slug, color: DEFAULT_COLOR })
  }

  return tags
}

export async function generateAiTags(
  input: AiTagInput,
  existingTagNames: readonly string[],
): Promise<AiTagResult> {
  if (!env.ANTHROPIC_API_KEY) {
    logger.info('AI tagger skipped: no ANTHROPIC_API_KEY')
    return { ok: true, tags: [] }
  }

  try {
    const userPrompt = buildUserPrompt(input)
    logger.info('AI tagger request', { type: input.type, title: input.title })

    const { output } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      output: Output.object({ schema: tagSchema }),
      system: buildSystemPrompt(existingTagNames),
      prompt: userPrompt,
    })

    if (!output) return { ok: false, error: 'No structured output generated' }

    const tags = deduplicateAndSlugify(output.tags)
    logger.info('AI tagger response', { tags: tags.map((t) => t.name) })
    return { ok: true, tags }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI error'
    logger.warn('AI tagger failed', { error: message, type: input.type, title: input.title })
    return { ok: false, error: message }
  }
}

/**
 * Run AI tagging for an item. Fetches existing tags, generates AI tags,
 * and applies them. Caller should wrap in after() for serverless survival.
 */
export async function runAiTagging(itemId: string, input: AiTagInput): Promise<void> {
  try {
    const existingTags = await withTx((tx) => fetchTagNames(tx))
    const result = await generateAiTags(input, existingTags)
    if (result.ok && result.tags.length > 0) {
      await withTx((tx) => applyTags(tx, itemId, result.tags))
    }
  } catch (error) {
    logger.error('Background AI tagging failed', error, { itemId })
  }
}
