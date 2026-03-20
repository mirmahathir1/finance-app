import type { NextRequest } from 'next/server'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { requireAuthenticatedUser } from '@/app/api/_lib/auth'
import { success, errorResponse } from '@/app/api/auth/_lib/responses'
import { getConversionRates } from '@/lib/exchange-rates'
import {
  buildStatisticsCalendarData,
  normalizeTransactionsForDisplay,
} from '@/lib/statistics'
import type { Transaction } from '@/types'

function isValidMonth(value: string) {
  return /^\d{4}-\d{2}$/.test(value)
}

function toExpandedDateRange(fromDate: string, toDate: string) {
  const fromParts = fromDate.split('-').map(Number)
  const toParts = toDate.split('-').map(Number)

  return {
    gte: new Date(Date.UTC(fromParts[0], fromParts[1] - 1, fromParts[2] - 1)),
    lte: new Date(Date.UTC(toParts[0], toParts[1] - 1, toParts[2] + 1)),
  }
}

function toTransactionPayload(record: {
  id: string
  userId: string
  profile: string
  occurredAt: Date
  amountMinor: bigint
  currency: string
  type: 'income' | 'expense'
  tags: string[]
  note: string | null
  createdAt: Date
  updatedAt: Date
}): Transaction {
  return {
    id: record.id,
    userId: record.userId,
    profile: record.profile,
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
    const profile = searchParams.get('profile')?.trim()
    const month = searchParams.get('month')?.trim()
    const currency = searchParams.get('currency')?.trim().toUpperCase()
    const includeConverted = searchParams.get('includeConverted') === 'true'

    if (!profile || !month || !currency) {
      return errorResponse(
        'Profile, month (YYYY-MM), and currency parameters are required.',
        400
      )
    }

    if (!isValidMonth(month)) {
      return errorResponse('Month must be in YYYY-MM format.', 400)
    }

    const [year, monthNumber] = month.split('-').map(Number)
    const monthDate = new Date(year, monthNumber - 1, 1)
    const fromDate = format(startOfMonth(monthDate), 'yyyy-MM-dd')
    const toDate = format(endOfMonth(monthDate), 'yyyy-MM-dd')

    const rows = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        profile,
        occurredAt: toExpandedDateRange(fromDate, toDate),
      },
      select: {
        id: true,
        userId: true,
        profile: true,
        occurredAt: true,
        amountMinor: true,
        currency: true,
        type: true,
        tags: true,
        note: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
    })

    const transactions = rows
      .filter((row) => {
        const transactionDate = row.occurredAt.toISOString().slice(0, 10)
        return transactionDate >= fromDate && transactionDate <= toDate
      })
      .map(toTransactionPayload)

    const rates = includeConverted ? await getConversionRates(currency) : {}
    const normalized = normalizeTransactionsForDisplay(
      transactions,
      {
        targetCurrency: currency,
        includeConverted,
        sourceCurrencyFilter: includeConverted ? undefined : currency,
      },
      rates
    )

    return success(
      buildStatisticsCalendarData(normalized.transactions, {
        month,
        currency,
        skippedCurrencies: normalized.skippedCurrencies,
      })
    )
  } catch {
    return errorResponse('Unable to load calendar statistics.', 500)
  }
}
