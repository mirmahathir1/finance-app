import type {
  StatisticsCalendarData,
  StatisticsData,
  Transaction,
} from '@/types'

interface NormalizeTransactionsOptions {
  targetCurrency: string
  includeConverted?: boolean
  sourceCurrencyFilter?: string
}

function getEffectiveAmountMinor(transaction: Transaction) {
  return transaction.displayAmountMinor ?? transaction.amountMinor
}

export function convertAmountMinor(
  amountMinor: number,
  sourceCurrency: string,
  targetCurrency: string,
  rates: Record<string, number>
): number | null {
  if (sourceCurrency === targetCurrency) {
    return amountMinor
  }

  const rate = rates[sourceCurrency]
  if (!rate || rate === 0) {
    return null
  }

  return Math.round(amountMinor / rate)
}

export function normalizeTransactionsForDisplay(
  transactions: Transaction[],
  options: NormalizeTransactionsOptions,
  rates: Record<string, number> = {}
): { transactions: Transaction[]; skippedCurrencies: string[] } {
  const { targetCurrency, includeConverted = false, sourceCurrencyFilter } = options
  const skippedCurrencies = new Set<string>()
  const normalized: Transaction[] = []

  for (const transaction of transactions) {
    if (!includeConverted) {
      if (sourceCurrencyFilter && transaction.currency !== sourceCurrencyFilter) {
        continue
      }

      normalized.push({
        ...transaction,
        displayAmountMinor: transaction.amountMinor,
        displayCurrency: targetCurrency || transaction.currency,
        originalAmountMinor: transaction.amountMinor,
        originalCurrency: transaction.currency,
        displayWasConverted: false,
      })
      continue
    }

    const convertedAmountMinor = convertAmountMinor(
      transaction.amountMinor,
      transaction.currency,
      targetCurrency,
      rates
    )

    if (convertedAmountMinor === null) {
      skippedCurrencies.add(transaction.currency)
      continue
    }

    normalized.push({
      ...transaction,
      displayAmountMinor: convertedAmountMinor,
      displayCurrency: targetCurrency,
      originalAmountMinor: transaction.amountMinor,
      originalCurrency: transaction.currency,
      displayWasConverted: transaction.currency !== targetCurrency,
    })
  }

  return {
    transactions: normalized,
    skippedCurrencies: Array.from(skippedCurrencies).sort(),
  }
}

export function buildStatisticsData(
  transactions: Transaction[],
  options: {
    from: string
    to: string
    currency: string
    skippedCurrencies?: string[]
  }
): StatisticsData {
  const expenseMap = new Map<string, number>()
  const incomeMap = new Map<string, number>()
  let totalIncome = 0
  let totalExpense = 0

  for (const transaction of transactions) {
    const amountMinor = getEffectiveAmountMinor(transaction)
    const isIncome = transaction.type === 'income'

    if (isIncome) {
      totalIncome += amountMinor
    } else {
      totalExpense += amountMinor
    }

    const tags = transaction.tags.length > 0 ? transaction.tags : ['Uncategorized']
    for (const tag of tags) {
      if (isIncome) {
        incomeMap.set(tag, (incomeMap.get(tag) || 0) + amountMinor)
      } else {
        expenseMap.set(tag, (expenseMap.get(tag) || 0) + amountMinor)
      }
    }
  }

  return {
    summary: {
      totalIncome: {
        amountMinor: totalIncome,
        currency: options.currency,
      },
      totalExpense: {
        amountMinor: totalExpense,
        currency: options.currency,
      },
      netBalance: {
        amountMinor: totalIncome - totalExpense,
        currency: options.currency,
      },
    },
    expenseBreakdown: Array.from(expenseMap.entries())
      .map(([tag, amountMinor]) => ({
        tag,
        amountMinor,
        currency: options.currency,
        percentage:
          totalExpense > 0 ? Math.round((amountMinor / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amountMinor - a.amountMinor),
    incomeBreakdown: Array.from(incomeMap.entries())
      .map(([tag, amountMinor]) => ({
        tag,
        amountMinor,
        currency: options.currency,
        percentage:
          totalIncome > 0 ? Math.round((amountMinor / totalIncome) * 100) : 0,
      }))
      .sort((a, b) => b.amountMinor - a.amountMinor),
    period: {
      from: options.from,
      to: options.to,
      currency: options.currency,
    },
    meta: {
      skippedCurrencies: options.skippedCurrencies ?? [],
    },
  }
}

export function buildStatisticsCalendarData(
  transactions: Transaction[],
  options: {
    month: string
    currency: string
    skippedCurrencies?: string[]
  }
): StatisticsCalendarData {
  const dayMap = new Map<
    string,
    { income: number; expense: number }
  >()

  for (const transaction of transactions) {
    const amountMinor = getEffectiveAmountMinor(transaction)
    if (amountMinor === 0) continue

    const day = transaction.occurredAt
    const existing = dayMap.get(day) || { income: 0, expense: 0 }

    if (transaction.type === 'income') {
      existing.income += amountMinor
    } else {
      existing.expense += amountMinor
    }

    dayMap.set(day, existing)
  }

  return {
    month: options.month,
    currency: options.currency,
    days: Array.from(dayMap.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, totals]) => ({
        date,
        totalIncome: {
          amountMinor: totals.income,
          currency: options.currency,
        },
        totalExpense: {
          amountMinor: totals.expense,
          currency: options.currency,
        },
      }))
      .filter((day) => day.date.startsWith(`${options.month}-`))
      .filter(
        (day) =>
          day.totalIncome.amountMinor > 0 || day.totalExpense.amountMinor > 0
      ),
    meta: {
      skippedCurrencies: options.skippedCurrencies ?? [],
    },
  }
}
