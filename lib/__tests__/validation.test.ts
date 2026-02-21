import { describe, expect, it } from 'vitest'
import {
  MAX_BODY_SIZE,
  ingestSchema,
  itemsQuerySchema,
  parseQueryParams,
  updateItemSchema,
} from '../validation'

describe('updateItemSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    const result = updateItemSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts partial updates', () => {
    expect(updateItemSchema.safeParse({ title: 'New Title' }).success).toBe(true)
    expect(updateItemSchema.safeParse({ status: 'archived' }).success).toBe(true)
  })

  it('rejects invalid status', () => {
    const result = updateItemSchema.safeParse({ status: 'invalid-status' })
    expect(result.success).toBe(false)
  })

  it('accepts valid status values', () => {
    const statuses = ['inbox', 'queued', 'reading', 'done', 'archived']
    for (const status of statuses) {
      expect(updateItemSchema.safeParse({ status }).success).toBe(true)
    }
  })
})

describe('ingestSchema', () => {
  it('accepts input field', () => {
    const result = ingestSchema.safeParse({ input: 'https://example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects empty input', () => {
    const result = ingestSchema.safeParse({ input: '' })
    expect(result.success).toBe(false)
  })

  it('rejects input over 2048 chars', () => {
    const result = ingestSchema.safeParse({ input: 'a'.repeat(2049) })
    expect(result.success).toBe(false)
  })
})

describe('itemsQuerySchema', () => {
  it('provides defaults for empty params', () => {
    const result = itemsQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(50)
      expect(result.data.offset).toBe(0)
      expect(result.data.sort).toBe('createdAt')
      expect(result.data.order).toBe('desc')
    }
  })

  it('coerces string numbers', () => {
    const result = itemsQuerySchema.safeParse({ limit: '25', offset: '10' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(25)
      expect(result.data.offset).toBe(10)
    }
  })

  it('clamps limit to valid range', () => {
    expect(itemsQuerySchema.safeParse({ limit: '0' }).success).toBe(false)
    expect(itemsQuerySchema.safeParse({ limit: '101' }).success).toBe(false)
    expect(itemsQuerySchema.safeParse({ limit: '100' }).success).toBe(true)
  })

  it('rejects negative offset', () => {
    expect(itemsQuerySchema.safeParse({ offset: '-1' }).success).toBe(false)
  })
})

describe('parseQueryParams', () => {
  it('converts URLSearchParams to validated object', () => {
    const params = new URLSearchParams('limit=25&offset=0')
    const result = parseQueryParams(params, itemsQuerySchema)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(25)
    }
  })

  it('handles duplicate params (last wins)', () => {
    const params = new URLSearchParams('status=inbox&status=done')
    const result = parseQueryParams(params, itemsQuerySchema)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('done')
    }
  })

  it('returns error for invalid params', () => {
    const params = new URLSearchParams('limit=invalid')
    const result = parseQueryParams(params, itemsQuerySchema)
    expect(result.success).toBe(false)
  })
})

describe('MAX_BODY_SIZE', () => {
  it('is 100KB', () => {
    expect(MAX_BODY_SIZE).toBe(100 * 1024)
  })
})
