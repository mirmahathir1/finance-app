'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
  Typography,
  Grid,
  Card,
  CardContent,
  Skeleton,
  Checkbox,
  FormControlLabel,
  Fade,
} from '@mui/material'
import { TransitionGroup } from 'react-transition-group'
import { PageLayout } from '@/components/PageLayout'
import { Snackbar } from '@/components/Snackbar'
import { EmptyState } from '@/components/EmptyState'
import { useProfile } from '@/contexts/ProfileContext'
import { useApi } from '@/utils/useApi'
import { formatAmount } from '@/utils/amount'
import { startOfMonth, endOfMonth } from 'date-fns'
import type { StatisticsData, Transaction } from '@/types'
import { ErrorState } from '@/components/ErrorState'
import { getFriendlyErrorMessage } from '@/utils/error'
import { AnimatedSection } from '@/components/AnimatedSection'
import { usePrefersReducedMotion, getMotionDuration } from '@/utils/motion'

const EXPENSE_COLORS = ['#e53935', '#d32f2f', '#ef5350', '#f44336', '#ff7043', '#ff8a65']

type ConversionAggregation = {
  totalIncome: number
  totalExpense: number
  incomeByTag: Record<string, number>
  expenseByTag: Record<string, number>
  skippedCurrencies: Set<string>
}

function aggregateConvertedTransactions(
  transactions: Transaction[],
  baseCurrency: string,
  rates: Record<string, number>
): ConversionAggregation {
  return transactions.reduce<ConversionAggregation>(
    (acc, transaction) => {
      if (transaction.currency === baseCurrency) {
        return acc
      }

      const rate = rates[transaction.currency]
      if (!rate || rate === 0) {
        acc.skippedCurrencies.add(transaction.currency)
        return acc
      }

      const convertedMinor = Math.round(transaction.amountMinor / rate)

      if (transaction.type === 'expense') {
        acc.totalExpense += convertedMinor
        transaction.tags.forEach((tag) => {
          acc.expenseByTag[tag] = (acc.expenseByTag[tag] || 0) + convertedMinor
        })
      } else {
        acc.totalIncome += convertedMinor
        transaction.tags.forEach((tag) => {
          acc.incomeByTag[tag] = (acc.incomeByTag[tag] || 0) + convertedMinor
        })
      }

      return acc
    },
    {
      totalIncome: 0,
      totalExpense: 0,
      incomeByTag: {},
      expenseByTag: {},
      skippedCurrencies: new Set<string>(),
    }
  )
}

function mergeStatsWithConversions(
  baseStats: StatisticsData,
  additions: ConversionAggregation,
  currency: string
): StatisticsData {
  if (additions.totalIncome === 0 && additions.totalExpense === 0) {
    return baseStats
  }

  const totalIncome = baseStats.summary.totalIncome.amountMinor + additions.totalIncome
  const totalExpense = baseStats.summary.totalExpense.amountMinor + additions.totalExpense
  const netBalance = totalIncome - totalExpense

  const expenseMap = new Map<string, number>()
  baseStats.expenseBreakdown.forEach((item) => {
    expenseMap.set(item.tag, item.amountMinor)
  })
  Object.entries(additions.expenseByTag).forEach(([tag, amount]) => {
    expenseMap.set(tag, (expenseMap.get(tag) || 0) + amount)
  })
  const expenseBreakdown = Array.from(expenseMap.entries())
    .map(([tag, amountMinor]) => ({
      tag,
      amountMinor,
      currency,
      percentage: totalExpense > 0 ? Math.round((amountMinor / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amountMinor - a.amountMinor)

  const incomeMap = new Map<string, number>()
  baseStats.incomeBreakdown.forEach((item) => {
    incomeMap.set(item.tag, item.amountMinor)
  })
  Object.entries(additions.incomeByTag).forEach(([tag, amount]) => {
    incomeMap.set(tag, (incomeMap.get(tag) || 0) + amount)
  })
  const incomeBreakdown = Array.from(incomeMap.entries())
    .map(([tag, amountMinor]) => ({
      tag,
      amountMinor,
      currency,
      percentage: totalIncome > 0 ? Math.round((amountMinor / totalIncome) * 100) : 0,
    }))
    .sort((a, b) => b.amountMinor - a.amountMinor)

  return {
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
        amountMinor: netBalance,
        currency,
      },
    },
    expenseBreakdown,
    incomeBreakdown,
    period: {
      ...baseStats.period,
      currency,
    },
  }
}

const ChartSkeleton = ({ height = 360 }: { height?: number }) => (
  <Paper elevation={2} sx={{ p: 3, height }}>
    <Skeleton variant="text" width="40%" height={28} />
    <Skeleton variant="rectangular" height={height - 80} sx={{ mt: 2, borderRadius: 1 }} />
  </Paper>
)

const ExpenseBreakdownPie = dynamic(
  () =>
    import('@/components/ExpenseBreakdownPie').then((mod) => ({
      default: mod.ExpenseBreakdownPie,
    })),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={420} />,
  }
)

const IncomeExpenseBar = dynamic(
  () =>
    import('@/components/IncomeExpenseBar').then((mod) => ({
      default: mod.IncomeExpenseBar,
    })),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={360} />,
  }
)

export default function StatisticsPage() {
  const router = useRouter()
  const { activeProfile } = useProfile()
  const api = useApi()
  const prefersReducedMotion = usePrefersReducedMotion()
  const contentTransitionDuration = getMotionDuration(prefersReducedMotion, 320)

  // Filters
  const [years, setYears] = useState<number[]>([new Date().getFullYear()])
  const [months] = useState<{ value: number; label: string }[]>(
    [
      { value: 0, label: 'January' },
      { value: 1, label: 'February' },
      { value: 2, label: 'March' },
      { value: 3, label: 'April' },
      { value: 4, label: 'May' },
      { value: 5, label: 'June' },
      { value: 6, label: 'July' },
      { value: 7, label: 'August' },
      { value: 8, label: 'September' },
      { value: 9, label: 'October' },
      { value: 10, label: 'November' },
      { value: 11, label: 'December' },
    ]
  )
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all')
  const [currencyOptions, setCurrencyOptions] = useState<string[]>([])
  const [currency, setCurrency] = useState<string>('')
  const [includeConverted, setIncludeConverted] = useState(false)
  const [conversionRatesCache, setConversionRatesCache] = useState<Record<string, Record<string, number>>>({})

  // Data
  const [profileTransactions, setProfileTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<StatisticsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  // Load transactions once per profile for derived data
  useEffect(() => {
    if (!activeProfile) {
      setProfileTransactions([])
      const fallbackYear = new Date().getFullYear()
      setYears([fallbackYear])
      setSelectedYear(fallbackYear)
      setCurrencyOptions([])
      setCurrency('')
      setIsLoadingTransactions(false)
      return
    }

    let isMounted = true
    const loadProfileTransactions = async () => {
      try {
        setIsLoadingTransactions(true)
        const txRes = await api.getTransactions({ profile: activeProfile })
        if (isMounted && txRes.success && txRes.data) {
          setProfileTransactions(txRes.data.transactions as Transaction[])
        }
      } catch (e) {
        if (isMounted) {
          setProfileTransactions([])
        }
      } finally {
        if (isMounted) {
          setIsLoadingTransactions(false)
        }
      }
    }

    loadProfileTransactions()
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile])

  // Derive available years from cached transactions
  const derivedYears = useMemo(() => {
    if (profileTransactions.length === 0) {
      return [new Date().getFullYear()]
    }
    const yearSet = new Set<number>()
    profileTransactions.forEach((t) => {
      yearSet.add(new Date(t.occurredAt).getFullYear())
    })
    return Array.from(yearSet).sort((a, b) => b - a)
  }, [profileTransactions])

  useEffect(() => {
    setYears(derivedYears)
    if (!derivedYears.includes(selectedYear)) {
      setSelectedYear(derivedYears[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedYears])

  // Compute date range from filters
  const { from, to } = useMemo(() => {
    const year = selectedYear
    if (selectedMonth === 'all') {
      const fromDate = new Date(year, 0, 1)
      const toDate = new Date(year, 11, 31)
      return {
        from: fromDate.toISOString().slice(0, 10),
        to: toDate.toISOString().slice(0, 10),
      }
    }
    const m = selectedMonth as number
    const fromDate = startOfMonth(new Date(year, m, 1))
    const toDate = endOfMonth(new Date(year, m, 1))
    return {
      from: fromDate.toISOString().slice(0, 10),
      to: toDate.toISOString().slice(0, 10),
    }
  }, [selectedYear, selectedMonth])

  // Derive currency options from cached transactions within range
  const derivedCurrencyOptions = useMemo(() => {
    if (profileTransactions.length === 0) return []
    const fromDate = new Date(from)
    const toDate = new Date(to)
    const codes = new Set<string>()
    profileTransactions.forEach((t) => {
      const occurred = new Date(t.occurredAt)
      if (occurred >= fromDate && occurred <= toDate && t.currency) {
        codes.add(t.currency)
      }
    })
    return Array.from(codes).sort()
  }, [profileTransactions, from, to])

  useEffect(() => {
    setCurrencyOptions(derivedCurrencyOptions)
    if (derivedCurrencyOptions.length === 0) {
      setCurrency('')
    } else if (!derivedCurrencyOptions.includes(currency)) {
      setCurrency(derivedCurrencyOptions[0])
    }
  }, [derivedCurrencyOptions, currency])

  useEffect(() => {
    if (!currency) {
      setIncludeConverted(false)
    }
  }, [currency])

  const transactionsInRange = useMemo(() => {
    if (!activeProfile) return []
    const fromDate = new Date(from)
    const toDate = new Date(to)
    return profileTransactions.filter((t) => {
      const occurred = new Date(t.occurredAt)
      return (
        t.profile === activeProfile &&
        occurred >= fromDate &&
        occurred <= toDate
      )
    })
  }, [profileTransactions, activeProfile, from, to])

  const ensureConversionRates = useCallback(
    async (baseCurrency: string) => {
      const normalized = baseCurrency.toUpperCase()
      if (conversionRatesCache[normalized]) {
        return conversionRatesCache[normalized]
      }

      const response = await fetch(`https://open.er-api.com/v6/latest/${normalized}`)
      if (!response.ok) {
        throw new Error('Failed to fetch conversion rates.')
      }
      const data = await response.json()
      if (!data || data.result !== 'success' || !data.rates) {
        throw new Error(data?.error || 'Unable to load conversion rates.')
      }

      setConversionRatesCache((prev) => ({
        ...prev,
        [normalized]: data.rates,
      }))

      return data.rates as Record<string, number>
    },
    [conversionRatesCache]
  )

  const loadStats = useCallback(async () => {
    if (!activeProfile || !currency) {
      setStats(null)
      setStatsError(null)
      return
    }

    try {
      setIsLoading(true)
      setStatsError(null)
      const res = await api.getStatistics({
        profile: activeProfile,
        from,
        to,
        currency,
      })

      if (res.success && res.data) {
        let nextStats: StatisticsData = res.data

        if (includeConverted) {
          const otherCurrencyTransactions = transactionsInRange.filter(
            (transaction) => transaction.currency && transaction.currency !== currency
          )

          if (otherCurrencyTransactions.length > 0) {
            try {
              const rates = await ensureConversionRates(currency)
              const conversionAggregation = aggregateConvertedTransactions(
                otherCurrencyTransactions,
                currency,
                rates
              )
              nextStats = mergeStatsWithConversions(res.data, conversionAggregation, currency)

              if (conversionAggregation.skippedCurrencies.size > 0) {
                setSnackbar({
                  open: true,
                  severity: 'warning',
                  message: `Missing exchange rate for: ${Array.from(
                    conversionAggregation.skippedCurrencies
                  ).join(', ')}`,
                })
              }
            } catch (conversionError: any) {
              const conversionMessage = getFriendlyErrorMessage(
                conversionError,
                'Unable to convert other currencies.'
              )
              setSnackbar({
                open: true,
                message: conversionMessage,
                severity: 'error',
              })
            }
          }
        }

        setStats(nextStats)
        setStatsError(null)
      } else {
        setStats(null)
        setStatsError(res.error?.message || 'Failed to load statistics.')
      }
    } catch (error: any) {
      const message = getFriendlyErrorMessage(error, 'Failed to load statistics.')
      setStats(null)
      setStatsError(message)
      setSnackbar({
        open: true,
        message,
        severity: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }, [
    activeProfile,
    from,
    to,
    currency,
    api,
    includeConverted,
    transactionsInRange,
    ensureConversionRates,
  ])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleRetryStats = () => {
    loadStats()
  }

  const hasData = stats && (stats.summary.totalIncome.amountMinor > 0 || stats.summary.totalExpense.amountMinor > 0)

  // Prepare pie data for expense breakdown
  const pieData = useMemo(() => {
    if (!stats) return []
    return stats.expenseBreakdown.map((item, idx) => ({
      name: item.tag,
      value: item.amountMinor / 100,
      color: EXPENSE_COLORS[idx % EXPENSE_COLORS.length],
    }))
  }, [stats])

  // Prepare bar data for income vs expense
  const incomeMajor = stats ? stats.summary.totalIncome.amountMinor / 100 : 0
  const expenseMajor = stats ? stats.summary.totalExpense.amountMinor / 100 : 0

  const shouldShowSkeleton =
    isLoadingTransactions || isLoading || (!currency && derivedCurrencyOptions.length > 0)
  const shouldShowEmptyState = !shouldShowSkeleton && (!currency || !hasData)

  const filtersKey = useMemo(
    () =>
      `${selectedYear}-${selectedMonth}-${currency || 'none'}-${
        includeConverted ? 'with-conversions' : 'base'
      }-${from}-${to}`,
    [selectedYear, selectedMonth, currency, includeConverted, from, to]
  )

  const statsView = useMemo(() => {
    if (shouldShowSkeleton) {
      return {
        key: `loading-${filtersKey}`,
        node: (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Grid container spacing={2}>
              {[0, 1, 2].map((item) => (
                <Grid key={item} size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
                  <Card sx={{ p: 2 }}>
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" height={36} />
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Skeleton variant="text" width="30%" height={28} />
              <Skeleton variant="rectangular" height={240} sx={{ mt: 2, borderRadius: 1 }} />
            </Paper>
          </Box>
        ),
      }
    }

    if (shouldShowEmptyState) {
      return {
        key: `empty-${filtersKey}`,
        node: (
          <EmptyState
            title="No statistics available"
            message={
              !currency
                ? 'No currencies found for the selected period.'
                : 'No data for the selected filters.'
            }
          />
        ),
      }
    }

    return {
      key: `stats-${filtersKey}-${stats!.summary.totalIncome.amountMinor}-${stats!.summary.totalExpense.amountMinor}-${stats!.summary.netBalance.amountMinor}`,
      node: (
        <>
          <AnimatedSection delay={50}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
                <Card sx={{ borderLeft: '4px solid', borderColor: 'success.main' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Income
                    </Typography>
                    <Typography variant="h5" color="success.main">
                      {formatAmount(stats!.summary.totalIncome.amountMinor, currency)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
                <Card sx={{ borderLeft: '4px solid', borderColor: 'error.main' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Expense
                    </Typography>
                    <Typography variant="h5" color="error.main">
                      {formatAmount(stats!.summary.totalExpense.amountMinor, currency)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
                <Card sx={{ borderLeft: '4px solid', borderColor: 'primary.main' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Net Balance
                    </Typography>
                    <Typography
                      variant="h5"
                      color={stats!.summary.netBalance.amountMinor >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatAmount(stats!.summary.netBalance.amountMinor, currency)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </AnimatedSection>

          <AnimatedSection delay={120}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                <ExpenseBreakdownPie items={pieData} height={420} />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }} sx={{ minWidth: 0 }}>
                <IncomeExpenseBar income={incomeMajor} expense={expenseMajor} currency={currency} />
              </Grid>
            </Grid>
          </AnimatedSection>
        </>
      ),
    }
  }, [currency, expenseMajor, filtersKey, incomeMajor, pieData, shouldShowEmptyState, shouldShowSkeleton, stats])

  if (!activeProfile) {
    return (
      <PageLayout>
        <Container maxWidth="lg">
          <Box sx={{ mt: 4 }}>
            <EmptyState
              title="Select a profile"
              message="Please select a profile to view statistics."
            />
          </Box>
        </Container>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Container maxWidth="lg">
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography variant="h4">Statistics</Typography>
          <Box
            sx={{
              width: { xs: '100%', sm: 'auto' },
              display: 'flex',
              justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            }}
          >
            <Button
              variant="outlined"
              onClick={() => router.push('/')}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Box>

        {statsError && (
          <ErrorState
            title="Unable to load statistics"
            message={statsError}
            onRetry={handleRetryStats}
          />
        )}

        {/* Filters */}
        <AnimatedSection>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ flexWrap: 'wrap', alignItems: 'center' }}
            >
              <FormControl sx={{ minWidth: 140 }}>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Year"
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {years.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Month"
                  onChange={(e) =>
                    setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                >
                  <MenuItem value="all">All months</MenuItem>
                  {months.map((m) => (
                    <MenuItem key={m.value} value={m.value}>
                      {m.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 180 }} disabled={currencyOptions.length === 0}>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={currency}
                  label="Currency"
                  onChange={(e) => setCurrency(String(e.target.value))}
                >
                  {currencyOptions.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeConverted}
                    onChange={(event) => setIncludeConverted(event.target.checked)}
                    disabled={!currency}
                  />
                }
                label="Include other currencies (convert to selected currency)"
              />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Exchange rates fetched from https://open.er-api.com (base currency: {currency || 'N/A'}).
            </Typography>
          </Paper>
        </AnimatedSection>

        {/* Content */}
        {!statsError &&
          (prefersReducedMotion ? (
            <Box key={statsView.key}>{statsView.node}</Box>
          ) : (
            <TransitionGroup component={null}>
              <Fade
                key={statsView.key}
                timeout={contentTransitionDuration}
                mountOnEnter
                unmountOnExit
              >
                <Box sx={{ width: '100%' }}>{statsView.node}</Box>
              </Fade>
            </TransitionGroup>
          ))}

        <Snackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </Container>
    </PageLayout>
  )
}


