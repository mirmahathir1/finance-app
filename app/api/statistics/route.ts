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
    
    const fromDateParam = searchParams.get('from')
    const toDateParam = searchParams.get('to')

    if (!profile || !currency || !fromDateParam || !toDateParam) {
      return errorResponse(
        'Profile, currency, from (YYYY-MM-DD), and to (YYYY-MM-DD) parameters are required.',
        400
      )
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDateParam) || !/^\d{4}-\d{2}-\d{2}$/.test(toDateParam)) {
      return errorResponse('Dates must be in YYYY-MM-DD format.', 400)
    }

    // Create expanded date range for DB query (to account for timezone edge cases)
    const fromParts = fromDateParam.split('-').map(Number)
    const toParts = toDateParam.split('-').map(Number)
    const expandedStart = new Date(Date.UTC(fromParts[0], fromParts[1] - 1, fromParts[2] - 1))
    const expandedEnd = new Date(Date.UTC(toParts[0], toParts[1] - 1, toParts[2] + 1))

    const dateWhere = {
      gte: expandedStart,
      lte: expandedEnd,
    }

    // Fetch base currency transactions
    const baseTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        profile,
        currency,
        occurredAt: dateWhere,
      },
      select: {
        type: true,
        amountMinor: true,
        tags: true,
        occurredAt: true,
      },
    })

    // Filter by exact date (YYYY-MM-DD comparison)
    const filteredBaseTransactions = baseTransactions.filter((t) => {
      const transactionDate = t.occurredAt.toISOString().slice(0, 10)
      return transactionDate >= fromDateParam && transactionDate <= toDateParam
    })

    // Calculate summary aggregates
    let totalIncome = 0
    let totalExpense = 0
    const expenseMap = new Map<string, number>()
    const incomeMap = new Map<string, number>()

    filteredBaseTransactions.forEach((t) => {
      const amount = Number(t.amountMinor)
      const isIncome = t.type === 'income'
      
      if (isIncome) {
        totalIncome += amount
      } else {
        totalExpense += amount
      }

      // Handle tags
      if (t.tags && t.tags.length > 0) {
        t.tags.forEach((tag: string) => {
          if (isIncome) {
            incomeMap.set(tag, (incomeMap.get(tag) || 0) + amount)
          } else {
            expenseMap.set(tag, (expenseMap.get(tag) || 0) + amount)
          }
        })
      } else {
        // Uncategorized
        if (isIncome) {
          incomeMap.set('Uncategorized', (incomeMap.get('Uncategorized') || 0) + amount)
        } else {
          expenseMap.set('Uncategorized', (expenseMap.get('Uncategorized') || 0) + amount)
        }
      }
    })

    const metaSkipped = new Set<string>()

    // Handle currency conversion if requested
    if (includeConverted) {
      // Fetch other currency transactions
      const otherTransactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          profile,
          currency: { not: currency },
          occurredAt: dateWhere,
        },
        select: {
          type: true,
          amountMinor: true,
          tags: true,
          occurredAt: true,
          currency: true,
        },
      })

      // Filter by exact date
      const filteredOtherTransactions = otherTransactions.filter((t) => {
        const transactionDate = t.occurredAt.toISOString().slice(0, 10)
        return transactionDate >= fromDateParam && transactionDate <= toDateParam
      })

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

      filteredOtherTransactions.forEach((t) => {
        const amount = Number(t.amountMinor)
        const converted = convertAmount(amount, t.currency)
        if (!converted) return

        const isIncome = t.type === 'income'
        
        if (isIncome) {
          totalIncome += converted
        } else {
          totalExpense += converted
        }

        // Handle tags
        if (t.tags && t.tags.length > 0) {
          t.tags.forEach((tag: string) => {
            if (isIncome) {
              incomeMap.set(tag, (incomeMap.get(tag) || 0) + converted)
            } else {
              expenseMap.set(tag, (expenseMap.get(tag) || 0) + converted)
            }
          })
        } else {
          // Uncategorized
          if (isIncome) {
            incomeMap.set('Uncategorized', (incomeMap.get('Uncategorized') || 0) + converted)
          } else {
            expenseMap.set('Uncategorized', (expenseMap.get('Uncategorized') || 0) + converted)
          }
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
        from: fromDateParam,
        to: toDateParam,
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
