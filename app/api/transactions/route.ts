import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthenticatedUser } from '@/app/api/_lib/auth'
import { success, errorResponse } from '@/app/api/auth/_lib/responses'
import { recordCatalogValidationFailure } from '@/lib/telemetry'
import type { Prisma, TransactionType } from '@prisma/client'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 10000

function parseDate(input?: string | null): Date | undefined {
  if (!input) return undefined
  const date = new Date(input)
  return Number.isNaN(date.getTime()) ? undefined : date
}

// Parse date string (YYYY-MM-DD) and return start/end of day in UTC
// to ensure proper date-only comparison regardless of timezone
function parseDateForFilter(input?: string | null): { start?: Date; end?: Date } {
  if (!input) return {}
  
  // Validate the date string format (YYYY-MM-DD)
  const dateMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!dateMatch) return {}
  
  const [, year, month, day] = dateMatch
  // Create a date at the start of the day in UTC
  const start = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0))
  // Create a date at the end of the day in UTC
  const end = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999))
  
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {}
  }
  
  return { start, end }
}

function toTransactionPayload(record: Prisma.TransactionGetPayload<{}>) {
  return {
    id: record.id,
    userId: record.userId,
    profile: record.profile,
    // Send date-only string to avoid timezone shifts on the client
    occurredAt: record.occurredAt.toISOString().slice(0, 10),
    amountMinor: Number(record.amountMinor),
    currency: record.currency,
    type: record.type,
    tags: record.tags ?? [],
    note: record.note,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuthenticatedUser()
  if (!user) {
    return response!
  }

  try {
    const { searchParams } = request.nextUrl
    const profileParam = searchParams.get('profile')
    const profile = profileParam ? profileParam.trim() : undefined

    const typeParam = searchParams.get('type')
    const typeFilter =
      typeParam === 'income' || typeParam === 'expense' ? typeParam : undefined

    const currencyParam = searchParams.get('currency')
    const currencyFilter = currencyParam
      ? currencyParam.trim().toUpperCase()
      : undefined

    const tagParam = searchParams.get('tag')
    const tagFilter = tagParam ? tagParam.trim() : undefined

    const fromDateParam = searchParams.get('from')
    const toDateParam = searchParams.get('to')
    
    const fromDateFilter = parseDateForFilter(fromDateParam)
    const toDateFilter = parseDateForFilter(toDateParam)

    if (fromDateParam && !fromDateFilter.start) {
      return errorResponse('Invalid from date. Expected format: YYYY-MM-DD', 400)
    }
    if (toDateParam && !toDateFilter.end) {
      return errorResponse('Invalid to date. Expected format: YYYY-MM-DD', 400)
    }

    const limitParam = searchParams.get('limit')
    const offsetParam = Number.parseInt(searchParams.get('offset') ?? '', 10)

    // If limit is explicitly set, use it (with max cap for safety)
    // If limit is not set, fetch all transactions (no limit)
    const limit = limitParam !== null && limitParam !== ''
      ? (Number.isFinite(Number.parseInt(limitParam, 10))
          ? Math.max(1, Math.min(MAX_LIMIT, Number.parseInt(limitParam, 10)))
          : undefined)
      : undefined
    const offset = Number.isFinite(offsetParam) ? Math.max(0, offsetParam) : 0

    const where: Prisma.TransactionWhereInput = {
      userId: user.id,
    }

    if (profile) {
      where.profile = profile
    }

    if (typeFilter) {
      where.type = typeFilter as TransactionType
    }

    if (currencyFilter) {
      where.currency = currencyFilter
    }

    if (tagFilter) {
      where.tags = {
        has: tagFilter,
      }
    }

    // For date filtering, we'll apply it after fetching to ensure correct date-only comparison
    // Expand the DB query to include a wider date range if date filters are provided
    if (fromDateFilter.start || toDateFilter.end) {
      where.occurredAt = {}
      if (fromDateFilter.start) {
        // Query from 1 day before to account for timezone differences
        const expandedStart = new Date(fromDateFilter.start)
        expandedStart.setDate(expandedStart.getDate() - 1)
        where.occurredAt.gte = expandedStart
      }
      if (toDateFilter.end) {
        // Query until 1 day after to account for timezone differences  
        const expandedEnd = new Date(toDateFilter.end)
        expandedEnd.setDate(expandedEnd.getDate() + 1)
        where.occurredAt.lte = expandedEnd
      }
    }

    const rows = await prisma.transaction.findMany({
      where,
      orderBy: [
        { occurredAt: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Filter by date on application side for accurate date-only comparison
    let filteredRows = rows
    if (fromDateParam || toDateParam) {
      filteredRows = rows.filter((row) => {
        // Extract date in YYYY-MM-DD format from the UTC timestamp
        const transactionDate = row.occurredAt.toISOString().slice(0, 10)
        
        if (fromDateParam && transactionDate < fromDateParam) {
          return false
        }
        if (toDateParam && transactionDate > toDateParam) {
          return false
        }
        return true
      })
    }

    // Apply pagination after filtering
    const total = filteredRows.length
    const paginatedRows = limit !== undefined
      ? filteredRows.slice(offset, offset + limit)
      : filteredRows.slice(offset)

    return success({
      transactions: paginatedRows.map(toTransactionPayload),
      pagination: {
        total,
        limit: limit ?? total,
        offset,
        hasMore: limit !== undefined ? offset + limit < total : false,
      },
    })
  } catch (error) {
    return errorResponse('Unable to load transactions.', 500)
  }
}

export async function POST(request: Request) {
  const { user, response } = await requireAuthenticatedUser()
  if (!user) {
    return response!
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    const profile = typeof body.profile === 'string' ? body.profile.trim() : ''
    const occurredAtInput = typeof body.occurredAt === 'string' ? body.occurredAt : ''
    const amountMinorInput = Number(body.amountMinor)
    const currency =
      typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : ''
    const type = body.type === 'income' || body.type === 'expense' ? body.type : null
    const note =
      typeof body.note === 'string' && body.note.trim().length > 0
        ? body.note.trim()
        : null
    const tags = Array.isArray(body.tags)
      ? Array.from(
          new Set(
            body.tags
              .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
              .filter((tag) => Boolean(tag))
          )
        )
      : []

    if (!profile) {
      recordCatalogValidationFailure('profile', 'transactions.create')
      return errorResponse('Profile is required.', 400)
    }

    const occurredAt = parseDate(occurredAtInput)
    if (!occurredAt) {
      return errorResponse('A valid occurredAt date is required.', 400)
    }

    if (!Number.isFinite(amountMinorInput) || amountMinorInput <= 0) {
      return errorResponse('Amount must be greater than 0.', 400)
    }

    if (!currency) {
      recordCatalogValidationFailure('currency', 'transactions.create')
      return errorResponse('Currency is required.', 400)
    }

    if (!type) {
      recordCatalogValidationFailure('type', 'transactions.create')
      return errorResponse('Transaction type must be income or expense.', 400)
    }

    if (tags.length === 0) {
      recordCatalogValidationFailure('tags', 'transactions.create')
      return errorResponse('At least one tag is required.', 400)
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        profile,
        occurredAt,
        amountMinor: BigInt(Math.round(amountMinorInput)),
        currency,
        type,
        tags,
        note,
      },
    })

    return success(
      {
        transaction: toTransactionPayload(transaction),
      },
      { status: 201 }
    )
  } catch (error: any) {
    
    // Provide more detailed error information for debugging
    const errorMessage = error?.message || 'Unknown error'
    const errorCode = error?.code || 'UNKNOWN_ERROR'
    
    // Check for common database errors
    if (errorCode === 'P2002') {
      return errorResponse('A transaction with this information already exists.', 400)
    }
    if (errorCode === 'P2003') {
      return errorResponse('Invalid user reference. Please try logging in again.', 400)
    }
    if (errorMessage.includes('Foreign key constraint')) {
      return errorResponse('Invalid user reference. Please try logging in again.', 400)
    }
    
    return errorResponse(
      `Unable to create transaction: ${errorMessage}. Please try again.`,
      500
    )
  }
}


