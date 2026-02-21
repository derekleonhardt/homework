import { PrismaClient } from '@prisma/client'

declare global {
  // Required for global augmentation to prevent multiple Prisma instances
  var __prismaInstance: PrismaClient | undefined
}

export const prisma = globalThis.__prismaInstance ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalThis.__prismaInstance = prisma

/** Transaction client type shared by DB helpers. */
export type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

/** Execute queries in a transaction. */
export async function withTx<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => fn(tx))
}
