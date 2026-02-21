import { withTx } from '@/lib/db'
import { logger } from '@/lib/logger'
import { itemsQuerySchema, parseQueryParams } from '@/lib/validation'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const queryResult = parseQueryParams(request.nextUrl.searchParams, itemsQuerySchema)
    if (!queryResult.success) {
      return NextResponse.json({ error: queryResult.error }, { status: 400 })
    }

    const { status, type, sort, order, limit, offset } = queryResult.data

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (type) where.type = type

    // Parallel fetch for items and count in one transaction.
    const [items, total] = await withTx(async (tx) =>
      Promise.all([
        tx.item.findMany({
          where,
          include: {
            tags: { include: { tag: true } },
          },
          orderBy: { [sort]: order },
          take: limit,
          skip: offset,
        }),
        tx.item.count({ where }),
      ]),
    )

    return NextResponse.json({
      items,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch items', error)
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}
