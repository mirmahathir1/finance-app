import type { NextRequest } from 'next/server'
import type { TransactionType } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuthenticatedUser } from '@/app/api/_lib/auth'
import { success, errorResponse } from '@/app/api/auth/_lib/responses'

interface ExchangeRateResponse {
  result?: string
  rates?: Record<string, number>
  error?: string
}

function parseDate(value?: string | null): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function toNumber(value?: bigint | null) {
  return value ? Number(value) : 0
}

async function getConversionRates(baseCurrency: string): Promise<Record<string, number>> {
  const normalized = baseCurrency.toUpperCase()
  
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${normalized}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })
    
    if (!response.ok) {
      return {}
    }
    
    const data: ExchangeRateResponse = await response.json()
    
    if (data.result === 'success' && data.rates) {
      return data.rates
    }
    
    if (data.error) {
      return {}
    }
    
    return {}
  } catch {
    return {}
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
    const currency = searchParams.get('currency')?.trim().toUpperCase()
    const includeConverted = searchParams.get('includeConverted') === 'true'
    const fromDate = parseDate(searchParams.get('from'))
    const toDate = parseDate(searchParams.get('to'))

    if (!profile || !currency || !fromDate || !toDate) {
      return errorResponse(
        'Profile, currency, from, and to parameters are required.',
        400
      )
    }

    const dateWhere = {
      gte: fromDate,
      lte: toDate,
    }

    const baseWhere = {
      userId: user.id,
      profile,
      currency,
      occurredAt: dateWhere,
    }

    const [summaryAgg, tagAgg, emptyTagAgg] = await Promise.all([
      prisma.transaction.groupBy({
        where: baseWhere,
        by: ['type'],
        _sum: { amountMinor: true },
      }),
      prisma.$queryRaw<Array<{ type: TransactionType; tag: string; total: bigint }>>(
        Prisma.sql`
        SELECT
          "type",
          tag,
          SUM("amountMinor")::bigint AS total
        FROM "transactions"
        CROSS JOIN LATERAL unnest("tags") AS tag
        WHERE "userId"::text = ${user.id}
          AND "profile" = ${profile}
          AND "currency" = ${currency}
          AND "occurredAt" >= ${fromDate}
          AND "occurredAt" <= ${toDate}
          AND cardinality("tags") > 0
          AND "tags" IS NOT NULL
        GROUP BY "type", tag
      `
      ),
      prisma.$queryRaw<Array<{ type: TransactionType; total: bigint }>>(
        Prisma.sql`
        SELECT
          "type",
          SUM("amountMinor")::bigint AS total
        FROM "transactions"
        WHERE "userId"::text = ${user.id}
          AND "profile" = ${profile}
          AND "currency" = ${currency}
          AND "occurredAt" >= ${fromDate}
          AND "occurredAt" <= ${toDate}
          AND (cardinality("tags") = 0 OR "tags" IS NULL)
        GROUP BY "type"
      `
      ),
    ])

    let totalIncome = 0
    let totalExpense = 0
    const expenseMap = new Map<string, number>()
    const incomeMap = new Map<string, number>()

    summaryAgg.forEach((row) => {
      const amount = toNumber(row._sum?.amountMinor)
      if (row.type === 'income') {
        totalIncome += amount
      } else {
        totalExpense += amount
      }
    })

    tagAgg.forEach((row) => {
      const amount = toNumber(row.total)
      if (!amount) return
      if (row.type === 'income') {
        incomeMap.set(row.tag, (incomeMap.get(row.tag) || 0) + amount)
      } else {
        expenseMap.set(row.tag, (expenseMap.get(row.tag) || 0) + amount)
      }
    })

    emptyTagAgg.forEach((row) => {
      const amount = toNumber(row.total)
      if (!amount) return
      if (row.type === 'income') {
        incomeMap.set('Uncategorized', (incomeMap.get('Uncategorized') || 0) + amount)
      } else {
        expenseMap.set('Uncategorized', (expenseMap.get('Uncategorized') || 0) + amount)
      }
    })

    const metaSkipped = new Set<string>()

    if (includeConverted) {
      const [otherSummaryAgg, otherTagAgg, otherEmptyTagAgg] = await Promise.all([
        prisma.transaction.groupBy({
          where: {
            userId: user.id,
            profile,
            occurredAt: dateWhere,
            currency: { not: currency },
          },
          by: ['currency', 'type'],
          _sum: { amountMinor: true },
        }),
        prisma.$queryRaw<Array<{ currency: string; type: TransactionType; tag: string; total: bigint }>>(
          Prisma.sql`
          SELECT
            "currency",
            "type",
            tag,
            SUM("amountMinor")::bigint AS total
          FROM "transactions"
          CROSS JOIN LATERAL unnest("tags") AS tag
          WHERE "userId"::text = ${user.id}
            AND "profile" = ${profile}
            AND "currency" <> ${currency}
            AND "occurredAt" >= ${fromDate}
            AND "occurredAt" <= ${toDate}
            AND cardinality("tags") > 0
            AND "tags" IS NOT NULL
          GROUP BY "currency", "type", tag
        `
        ),
        prisma.$queryRaw<Array<{ currency: string; type: TransactionType; total: bigint }>>(
          Prisma.sql`
          SELECT
            "currency",
            "type",
            SUM("amountMinor")::bigint AS total
          FROM "transactions"
          WHERE "userId"::text = ${user.id}
            AND "profile" = ${profile}
            AND "currency" <> ${currency}
            AND "occurredAt" >= ${fromDate}
            AND "occurredAt" <= ${toDate}
            AND (cardinality("tags") = 0 OR "tags" IS NULL)
          GROUP BY "currency", "type"
        `
        ),
      ])

      const rates = await getConversionRates(currency)

      const convertAmount = (amount: number, sourceCurrency: string) => {
        if (sourceCurrency === currency) {
          return amount
        }
        const rate = rates[sourceCurrency]
        if (!rate || rate === 0) {
          metaSkipped.add(sourceCurrency)
          return 0
        }
        return Math.round(amount / rate)
      }

      otherSummaryAgg.forEach((row) => {
        const amount = toNumber(row._sum?.amountMinor)
        if (!amount) return
        const converted = convertAmount(amount, row.currency)
        if (!converted) return
        if (row.type === 'income') {
          totalIncome += converted
        } else {
          totalExpense += converted
        }
      })

      otherTagAgg.forEach((row) => {
        const amount = toNumber(row.total)
        if (!amount) return
        const converted = convertAmount(amount, row.currency)
        if (!converted) return
        if (row.type === 'income') {
          incomeMap.set(row.tag, (incomeMap.get(row.tag) || 0) + converted)
        } else {
          expenseMap.set(row.tag, (expenseMap.get(row.tag) || 0) + converted)
        }
      })

      otherEmptyTagAgg.forEach((row) => {
        const amount = toNumber(row.total)
        if (!amount) return
        const converted = convertAmount(amount, row.currency)
        if (!converted) return
        if (row.type === 'income') {
          incomeMap.set('Uncategorized', (incomeMap.get('Uncategorized') || 0) + converted)
        } else {
          expenseMap.set('Uncategorized', (expenseMap.get('Uncategorized') || 0) + converted)
        }
      })
    }

    const expenseBreakdown = Array.from(expenseMap.entries())
      .map(([tag, amountMinor]) => ({
        tag,
        amountMinor,
        currency,
        percentage:
          totalExpense > 0 ? Math.round((amountMinor / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amountMinor - a.amountMinor)

    const incomeBreakdown = Array.from(incomeMap.entries())
      .map(([tag, amountMinor]) => ({
        tag,
        amountMinor,
        currency,
        percentage:
          totalIncome > 0 ? Math.round((amountMinor / totalIncome) * 100) : 0,
      }))
      .sort((a, b) => b.amountMinor - a.amountMinor)

    return success({
      summary: {
        totalIncome: {
          amountMinor: totalIncome,
          currency,
        },
        totalExpense: {
          amountMinor: totalExpense,
          currency,
        },
        netBalance: {
          amountMinor: totalIncome - totalExpense,
          currency,
        },
      },
      expenseBreakdown,
      incomeBreakdown,
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        currency,
      },
      meta: {
        skippedCurrencies: Array.from(metaSkipped),
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return errorResponse(`Unable to load statistics: ${errorMessage}`, 500)
  }
}


