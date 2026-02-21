import { withTx } from '@/lib/db'
import { logger } from '@/lib/logger'
import { parseJsonBody, updateItemSchema } from '@/lib/validation'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

function isPrismaNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const bodyResult = await parseJsonBody(request, updateItemSchema)
  if (!bodyResult.success) {
    return NextResponse.json({ error: bodyResult.error }, { status: 400 })
  }

  const { title, status } = bodyResult.data

  try {
    const item = await withTx((tx) =>
      tx.item.update({
        where: { id },
        data: {
          ...(title !== undefined && { title: title.trim() }),
          ...(status !== undefined && { status }),
        },
        include: {
          tags: { include: { tag: true } },
        },
      }),
    )

    return NextResponse.json(item)
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    logger.error('Failed to update item', error, { id })
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    await withTx((tx) => tx.item.delete({ where: { id } }))
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    logger.error('Failed to delete item', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
