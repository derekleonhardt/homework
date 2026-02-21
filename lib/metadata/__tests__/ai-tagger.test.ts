import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('ai', () => ({
  generateText: vi.fn(),
  Output: { object: vi.fn(({ schema }: { schema: unknown }) => schema) },
}))

vi.mock('@/lib/env', () => ({
  env: { ANTHROPIC_API_KEY: 'test-key' },
}))

import { generateText } from 'ai'
import type { Mock } from 'vitest'
import { generateAiTags } from '../ai-tagger'

const mockGenerateText = generateText as Mock

describe('generateAiTags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns slugified AutoTag[] with default color', async () => {
    mockGenerateText.mockResolvedValue({
      output: { tags: [{ name: 'Machine Learning' }, { name: 'Python' }] },
    } as never)

    const result = await generateAiTags({ title: 'ML with Python', type: 'article' }, [])

    expect(result).toEqual({
      ok: true,
      tags: [
        { name: 'Machine Learning', slug: 'machine-learning', color: '#6B7280' },
        { name: 'Python', slug: 'python', color: '#6B7280' },
      ],
    })
  })

  it('passes existing tag names in system prompt', async () => {
    mockGenerateText.mockResolvedValue({
      output: { tags: [{ name: 'react' }] },
    } as never)

    await generateAiTags({ title: 'React hooks', type: 'article' }, [
      'react',
      'typescript',
      'nextjs',
    ])

    const callArgs = mockGenerateText.mock.calls[0][0] as { system: string }
    expect(callArgs.system).toContain('react')
    expect(callArgs.system).toContain('typescript')
    expect(callArgs.system).toContain('nextjs')
  })

  it('deduplicates returned tags by slug', async () => {
    mockGenerateText.mockResolvedValue({
      output: { tags: [{ name: 'React' }, { name: 'react' }, { name: 'REACT' }] },
    } as never)

    const result = await generateAiTags({ title: 'React', type: 'article' }, [])

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.tags).toHaveLength(1)
      expect(result.tags[0].slug).toBe('react')
    }
  })

  it('filters slugs < 2 chars', async () => {
    mockGenerateText.mockResolvedValue({
      output: { tags: [{ name: 'A' }, { name: 'AI' }] },
    } as never)

    const result = await generateAiTags({ title: 'AI stuff', type: 'article' }, [])

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.tags).toHaveLength(1)
      expect(result.tags[0].slug).toBe('ai')
    }
  })

  it('returns { ok: true, tags: [] } when no API key', async () => {
    const envModule = await import('@/lib/env')
    vi.spyOn(envModule, 'env', 'get').mockReturnValue({
      ANTHROPIC_API_KEY: undefined,
    } as never)

    const result = await generateAiTags({ title: 'Test', type: 'article' }, [])

    expect(result).toEqual({ ok: true, tags: [] })
    expect(mockGenerateText).not.toHaveBeenCalled()
  })

  it('returns { ok: false, error } on API error', async () => {
    mockGenerateText.mockRejectedValue(new Error('API rate limit'))

    const result = await generateAiTags({ title: 'Test', type: 'article' }, [])

    expect(result).toEqual({ ok: false, error: 'API rate limit' })
  })

  it('truncates rawInput to 1000 chars in prompt', async () => {
    mockGenerateText.mockResolvedValue({
      output: { tags: [{ name: 'test' }] },
    } as never)

    const longInput = 'x'.repeat(2000)
    await generateAiTags({ rawInput: longInput, type: 'note' }, [])

    const callArgs = mockGenerateText.mock.calls[0][0] as { prompt: string }
    expect(callArgs.prompt.length).toBeLessThan(1500)
  })

  it('handles note-type (uses rawInput, no title)', async () => {
    mockGenerateText.mockResolvedValue({
      output: { tags: [{ name: 'cooking' }] },
    } as never)

    const result = await generateAiTags(
      { rawInput: 'Recipe for pasta carbonara', type: 'note' },
      [],
    )

    expect(result.ok).toBe(true)
    const callArgs = mockGenerateText.mock.calls[0][0] as { prompt: string }
    expect(callArgs.prompt).toContain('Recipe for pasta carbonara')
  })

  it('returns error when output is undefined', async () => {
    mockGenerateText.mockResolvedValue({ output: undefined } as never)

    const result = await generateAiTags({ title: 'Test', type: 'article' }, [])

    expect(result).toEqual({ ok: false, error: 'No structured output generated' })
  })
})
