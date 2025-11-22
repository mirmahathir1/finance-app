import { prisma } from '@/lib/prisma'
import { success, errorResponse } from '@/app/api/auth/_lib/responses'
import { requireAuthenticatedUser } from '@/app/api/_lib/auth'
import { recordCatalogValidationFailure } from '@/lib/telemetry'
import type { TransactionType } from '@prisma/client'

function toPayload(record: any) {
  return {
    id: record.id,
    userId: record.userId,
    profile: record.profile,
    occurredAt: record.occurredAt.toISOString(),
    amountMinor: Number(record.amountMinor),
    currency: record.currency,
    type: record.type,
    tags: record.tags ?? [],
    note: record.note,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function sanitizeTags(input: unknown): string[] | undefined {
  if (!Array.isArray(input)) return undefined
  const tags = Array.from(
    new Set(
      input
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter((tag) => Boolean(tag))
    )
  )
  return tags
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuthenticatedUser()
  if (!user) {
    return response!
  }

  try {
    const { id } = await params
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!transaction) {
      return errorResponse('Transaction not found.', 404)
    }

    return success({ transaction: toPayload(transaction) })
  } catch (error) {
    console.error('get transaction error', error)
    return errorResponse('Unable to load transaction.', 500)
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuthenticatedUser()
  if (!user) {
    return response!
  }

  try {
    const { id } = await params
    const body = (await request.json()) as Record<string, unknown>
    const data: Record<string, unknown> = {}

    if (typeof body.profile === 'string' && body.profile.trim()) {
      data.profile = body.profile.trim()
    }

    if (typeof body.occurredAt === 'string' && body.occurredAt.trim()) {
      const occurredAt = new Date(body.occurredAt)
      if (Number.isNaN(occurredAt.getTime())) {
        return errorResponse('Invalid occurredAt date.', 400)
      }
      data.occurredAt = occurredAt
    }

    if (body.amountMinor !== undefined) {
      const amountMinor = Number(body.amountMinor)
      if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
        return errorResponse('Amount must be greater than 0.', 400)
      }
      data.amountMinor = BigInt(Math.round(amountMinor))
    }

    if (typeof body.currency === 'string' && body.currency.trim()) {
      data.currency = body.currency.trim().toUpperCase()
    }

    if (body.type === 'income' || body.type === 'expense') {
      data.type = body.type as TransactionType
    } else if (body.type !== undefined) {
      recordCatalogValidationFailure('type', 'transactions.update')
      return errorResponse('Transaction type must be income or expense.', 400)
    }

    const sanitizedTags = sanitizeTags(body.tags)
    if (sanitizedTags !== undefined) {
      if (sanitizedTags.length === 0) {
        recordCatalogValidationFailure('tags', 'transactions.update')
        return errorResponse('At least one tag is required.', 400)
      }
      data.tags = sanitizedTags
    }

    if (body.note !== undefined) {
      if (body.note === null) {
        data.note = null
      } else if (typeof body.note === 'string') {
        data.note = body.note.trim() || null
      } else {
        return errorResponse('Note must be a string.', 400)
      }
    }

    if (Object.keys(data).length === 0) {
      return errorResponse('No valid fields provided for update.', 400)
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return errorResponse('Transaction not found.', 404)
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data,
    })

    return success({ transaction: toPayload(transaction) })
  } catch (error) {
    console.error('update transaction error', error)
    return errorResponse('Unable to update transaction.', 500)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuthenticatedUser()
  if (!user) {
    return response!
  }

  try {
    const { id } = await params
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return errorResponse('Transaction not found.', 404)
    }

    await prisma.transaction.delete({
      where: { id },
    })

    return success({ message: 'Transaction deleted successfully.' })
  } catch (error) {
    console.error('delete transaction error', error)
    return errorResponse('Unable to delete transaction.', 500)
  }
}


