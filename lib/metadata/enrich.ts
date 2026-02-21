import { withTx } from '@/lib/db'
import { classifyUrl } from '@/lib/input-parser'
import { logger } from '@/lib/logger'
import type { AiTagInput } from './ai-tagger'
import { applyTags } from './apply-tags'
import { generateAutoTags } from './auto-tagger'
import { extractMetadata } from './extractor'

interface EnrichResult {
  aiTagInput: AiTagInput
}

/**
 * Enrich item with metadata from URL.
 * Returns AI tag input so caller can wrap runAiTagging in after().
 */
export async function enrichItem(itemId: string, url: string): Promise<EnrichResult | undefined> {
  try {
    await withTx(async (tx) =>
      tx.item.update({
        where: { id: itemId },
        data: { metadataStatus: 'processing' },
      }),
    )

    const metadata = await extractMetadata(url)

    await withTx(async (tx) => {
      await tx.item.update({
        where: { id: itemId },
        data: {
          title: metadata.title || undefined,
          description: metadata.description,
          imageUrl: metadata.imageUrl,
          imageWidth: metadata.imageWidth,
          imageHeight: metadata.imageHeight,
          faviconUrl: metadata.faviconUrl,
          siteName: metadata.siteName,
          author: metadata.author,
          publishedAt: metadata.publishedAt ? new Date(metadata.publishedAt) : null,
          wordCount: metadata.wordCount,
          readingTime: metadata.readingTime,
          enrichmentSource: metadata.enrichmentSource,
          metadataStatus: 'completed',
          ...(metadata.typeOverride ? { type: metadata.typeOverride } : {}),
        },
      })

      const autoTags = generateAutoTags(url, metadata)
      await applyTags(tx, itemId, autoTags)
    })

    return {
      aiTagInput: {
        title: metadata.title ?? undefined,
        author: metadata.author ?? undefined,
        description: metadata.description ?? undefined,
        siteName: metadata.siteName ?? undefined,
        type: metadata.typeOverride ?? classifyUrl(url),
        rawInput: url,
      },
    }
  } catch (error) {
    logger.error('Enrichment failed', error, { itemId })
    await withTx(async (tx) => {
      await tx.item.update({
        where: { id: itemId },
        data: { metadataStatus: 'failed' },
      })
    })
    return undefined
  }
}
