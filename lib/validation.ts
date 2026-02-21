import { z } from 'zod'

export const MAX_BODY_SIZE = 100 * 1024

const itemStatus = z.enum(['inbox', 'queued', 'reading', 'done', 'archived'])

const titleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(500, 'Title must be less than 500 characters')

// PATCH /api/items/[id]
export const updateItemSchema = z.object({
  title: titleSchema.optional(),
  status: itemStatus.optional(),
})

// POST /api/ingest (universal input)
export const ingestSchema = z.object({
  input: z
    .string()
    .min(1, 'Input is required')
    .max(2048, 'Input must be less than 2048 characters'),
})

// GET /api/items query params
export const itemsQuerySchema = z.object({
  status: itemStatus.optional(),
  type: z.enum(['article', 'video', 'post', 'podcast', 'book', 'note']).optional(),
  sort: z.enum(['createdAt', 'readingTime', 'publishedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type UpdateItemInput = z.infer<typeof updateItemSchema>
export type IngestInput = z.infer<typeof ingestSchema>
export type ItemsQuery = z.infer<typeof itemsQuerySchema>

// Safe JSON parser with size limit
export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  // Check content length
  const contentLength = request.headers.get('content-length')
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return { success: false, error: 'Request body too large (max 100KB)' }
  }

  // Parse JSON
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return { success: false, error: 'Invalid JSON in request body' }
  }

  // Validate with Zod
  const result = schema.safeParse(body)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    const field = firstIssue.path.join('.')
    const message = field ? `${field}: ${firstIssue.message}` : firstIssue.message
    return { success: false, error: message }
  }

  return { success: true, data: result.data }
}

// Parse query params
export function parseQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>,
): { success: true; data: T } | { success: false; error: string } {
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })

  const result = schema.safeParse(params)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    return { success: false, error: firstIssue.message }
  }

  return { success: true, data: result.data }
}
