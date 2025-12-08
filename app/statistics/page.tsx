'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
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
  Switch,
  FormControlLabel,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
} from '@mui/material'
import { TransitionGroup } from 'react-transition-group'
import { PageLayout } from '@/components/PageLayout'
import { Snackbar } from '@/components/Snackbar'
import { EmptyState } from '@/components/EmptyState'
import { useProfile } from '@/contexts/ProfileContext'
import { useApi } from '@/utils/useApi'
import { formatAmount } from '@/utils/amount'
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns'
import type { StatisticsData, Transaction } from '@/types'
import { useTag } from '@/contexts/TagContext'
import { TagChip } from '@/components/TagChip'
import { ErrorState } from '@/components/ErrorState'
import { getFriendlyErrorMessage } from '@/utils/error'
import { AnimatedSection } from '@/components/AnimatedSection'
import { usePrefersReducedMotion, getMotionDuration } from '@/utils/motion'

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
  const searchParams = useSearchParams()
  const { activeProfile } = useProfile()
  const { tags } = useTag()
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
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(new Date().getMonth())
  const [advancedDateSearch, setAdvancedDateSearch] = useState(false)
  const initialRange = useMemo(() => {
    const start = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const end = format(endOfMonth(new Date()), 'yyyy-MM-dd')
    return { from: start, to: end }
  }, [])
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>(initialRange)
  const [advancedFrom, setAdvancedFrom] = useState<string>(initialRange.from)
  const [advancedTo, setAdvancedTo] = useState<string>(initialRange.to)
  const [hasInitializedFilters, setHasInitializedFilters] = useState(false)
  const currencyFromUrlRef = useRef<string | null>(null)

  const setQueryParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      const currencyFromUrl = currencyFromUrlRef.current
      
      Object.entries(updates).forEach(([key, value]) => {
        // Never delete currency if it came from URL
        if (key === 'currency' && currencyFromUrl && (!value || value === '')) {
          // Preserve currency from URL
          params.set('currency', currencyFromUrl)
          return
        }
        if (value === undefined || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })
      
      // Ensure currency from URL is always preserved if it exists
      if (currencyFromUrl && !params.has('currency')) {
        params.set('currency', currencyFromUrl)
      }
      
      router.replace(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  const computeRangeFromYearMonth = useCallback(
    (year: number, month: number | 'all') => {
      if (month === 'all') {
        const fromDate = new Date(year, 0, 1)
        const toDate = new Date(year, 11, 31)
        return {
          from: format(fromDate, 'yyyy-MM-dd'),
          to: format(toDate, 'yyyy-MM-dd'),
        }
      }
      const m = month as number
      const fromDate = startOfMonth(new Date(year, m, 1))
      const toDate = endOfMonth(new Date(year, m, 1))
      return {
        from: format(fromDate, 'yyyy-MM-dd'),
        to: format(toDate, 'yyyy-MM-dd'),
      }
    },
    []
  )

  // Keep advanced inputs in sync with current effective range, without triggering data reload
  useEffect(() => {
    if (advancedDateSearch) {
      setAdvancedFrom(dateRange.from)
      setAdvancedTo(dateRange.to)
    }
  }, [advancedDateSearch, dateRange.from, dateRange.to])

  // Initialize state from URL (or write defaults to URL then initialize)
  useEffect(() => {
    if (hasInitializedFilters) return

    const params = new URLSearchParams(searchParams?.toString() ?? '')
    const hasParams = Array.from(params.keys()).length > 0

    const defaultYear = new Date().getFullYear()
    const defaultMonth = new Date().getMonth()
    const defaultRange = computeRangeFromYearMonth(defaultYear, defaultMonth)

    const nextAdvanced = params.get('advanced') === 'true'
    const nextYear = Number(params.get('year')) || defaultYear
    const rawMonth = params.get('month')
    const nextMonth: number | 'all' =
      rawMonth === 'all' ? 'all' : rawMonth !== null ? Number(rawMonth) : defaultMonth

    let nextRange = nextAdvanced
      ? {
          from: params.get('from') || defaultRange.from,
          to: params.get('to') || defaultRange.to,
        }
      : computeRangeFromYearMonth(nextYear, nextMonth)

    const nextCurrency = params.get('currency') || ''
    const nextIncludeConverted = params.get('includeConverted') === 'true'

    // Track if currency came from URL to prevent clearing it
    if (nextCurrency && params.has('currency')) {
      currencyFromUrlRef.current = nextCurrency
    }

    setAdvancedDateSearch(nextAdvanced)
    setSelectedYear(nextYear)
    setSelectedMonth(nextMonth)
    setDateRange(nextRange)
    setAdvancedFrom(nextRange.from)
    setAdvancedTo(nextRange.to)
    setCurrency(nextCurrency)
    setIncludeConverted(nextIncludeConverted)

    if (!hasParams) {
      // Set all default parameters explicitly
      const defaultParams: Record<string, string> = {
        year: String(nextYear),
        month: nextMonth === 'all' ? 'all' : String(nextMonth),
        from: nextRange.from,
        to: nextRange.to,
      }
      if (nextCurrency) {
        defaultParams.currency = nextCurrency
      }
      if (nextIncludeConverted) {
        defaultParams.includeConverted = 'true'
      }
      setQueryParams(defaultParams)
    }

    setHasInitializedFilters(true)
  }, [
    computeRangeFromYearMonth,
    hasInitializedFilters,
    searchParams,
    setQueryParams,
  ])
  const [currencyOptions, setCurrencyOptions] = useState<string[]>([])
  const [currency, setCurrency] = useState<string>('')
  const [includeConverted, setIncludeConverted] = useState(false)

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

  const profileFetchRef = useRef<{
    key: string | null
    promise: Promise<Transaction[]> | null
  }>({
    key: null,
    promise: null,
  })

  // Load transactions once per profile for derived data
  useEffect(() => {
    if (!activeProfile) {
      setProfileTransactions([])
      const fallbackYear = new Date().getFullYear()
      setYears([fallbackYear])
      setSelectedYear(fallbackYear)
      setCurrencyOptions([])
      // Don't clear currency if it came from URL
      if (!currencyFromUrlRef.current) {
        setCurrency('')
      }
      setIsLoadingTransactions(false)
      profileFetchRef.current = { key: null, promise: null }
      return
    }

    let isCancelled = false

    const existingPromise =
      profileFetchRef.current.key === activeProfile
        ? profileFetchRef.current.promise
        : null

    const fetchPromise =
      existingPromise ??
      (async () => {
        const txRes = await api.getTransactions({ profile: activeProfile })
        if (!txRes.success || !txRes.data) {
          throw new Error(
            txRes.success ? 'Failed to load transactions.' : txRes.error.message
          )
        }
        return txRes.data.transactions as Transaction[]
      })()

    profileFetchRef.current = { key: activeProfile, promise: fetchPromise }
    setIsLoadingTransactions(true)

    fetchPromise
      .then((transactions) => {
        if (!isCancelled) {
          setProfileTransactions(transactions)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setProfileTransactions([])
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingTransactions(false)
        }
        if (profileFetchRef.current.promise === fetchPromise) {
          profileFetchRef.current = { key: null, promise: null }
        }
      })

    return () => {
      isCancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile, api])

  // Derive available years from cached transactions
  const derivedYears = useMemo(() => {
    if (profileTransactions.length === 0) {
      return [new Date().getFullYear()]
    }
    const yearSet = new Set<number>()
    profileTransactions.forEach((t) => {
      // Parse date in local timezone to get correct year
      yearSet.add(parseISO(t.occurredAt).getFullYear())
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

  // Derive currency options from cached transactions within range
  const derivedCurrencyOptions = useMemo(() => {
    if (profileTransactions.length === 0) return []
    const codes = new Set<string>()
    profileTransactions.forEach((t) => {
      // Convert transaction date to YYYY-MM-DD in local timezone
      const transactionDate = format(parseISO(t.occurredAt), 'yyyy-MM-dd')
      if (transactionDate >= dateRange.from && transactionDate <= dateRange.to && t.currency) {
        codes.add(t.currency)
      }
    })
    return Array.from(codes).sort()
  }, [profileTransactions, dateRange.from, dateRange.to])

  const updateCurrency = useCallback(
    (value: string) => {
      // Don't clear currency if it came from URL - preserve it in both state and URL
      const currencyFromUrl = currencyFromUrlRef.current
      if (!value && currencyFromUrl) {
        // Currency came from URL, don't clear it
        return
      }
      // If user explicitly sets a different currency, clear the ref
      if (value && currencyFromUrl && value !== currencyFromUrl) {
        currencyFromUrlRef.current = null
      }
      setCurrency(value)
      // Only update URL if currency actually changed or if we're explicitly clearing it
      // Don't clear currency if it exists in URL and we're just setting state
      if (value || !searchParams?.has('currency')) {
        setQueryParams({ currency: value || undefined })
      }
    },
    [setQueryParams, searchParams]
  )

  useEffect(() => {
    if (!hasInitializedFilters) return
    
    setCurrencyOptions(derivedCurrencyOptions)
    
    const currencyFromUrl = currencyFromUrlRef.current
    
    if (derivedCurrencyOptions.length === 0) {
      // Only clear currency if it didn't come from URL
      if (!currencyFromUrl) {
        updateCurrency('')
      }
      // If currency came from URL but options haven't loaded yet, keep it
      return
    }
    
    // If currency came from URL, validate it's in available currencies
    if (currencyFromUrl) {
      if (derivedCurrencyOptions.includes(currencyFromUrl)) {
        // Currency from URL is valid - keep the ref set to preserve it in URL
        // Only clear ref if user explicitly changes to a different currency
        if (currency !== currencyFromUrl) {
          currencyFromUrlRef.current = null
        }
      } else {
        // Currency from URL is not in available currencies
        // Keep it in URL and state - let the API handle validation
        // Don't update or clear it
        return
      }
    }
    
    // Only update currency if it's not in available currencies AND didn't come from URL
    if (!derivedCurrencyOptions.includes(currency) && !currencyFromUrl) {
      updateCurrency(derivedCurrencyOptions[0])
    }
  }, [derivedCurrencyOptions, currency, updateCurrency, hasInitializedFilters])

  useEffect(() => {
    if (!hasInitializedFilters) return
    // Don't clear currency if it came from URL
    if (!currency && !currencyFromUrlRef.current) {
      setIncludeConverted(false)
      setQueryParams({ includeConverted: undefined, currency: undefined })
    }
  }, [currency, setQueryParams, hasInitializedFilters])

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
        from: dateRange.from,
        to: dateRange.to,
        currency,
        includeConverted,
      })

      if (res.success && res.data) {
        setStats(res.data)
        setStatsError(null)

        if (res.data.meta?.skippedCurrencies?.length) {
          setSnackbar({
            open: true,
            severity: 'warning',
            message: `Missing exchange rates for: ${res.data.meta.skippedCurrencies.join(', ')}`,
          })
        }
      } else {
        setStats(null)
        setStatsError(
          !res.success ? res.error.message : 'Failed to load statistics.'
        )
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
  }, [activeProfile, dateRange.from, dateRange.to, currency, api, includeConverted])

  useEffect(() => {
    if (!hasInitializedFilters) return
    loadStats()
  }, [loadStats, hasInitializedFilters])

  const handleRetryStats = () => {
    loadStats()
  }

  const hasData = stats && (stats.summary.totalIncome.amountMinor > 0 || stats.summary.totalExpense.amountMinor > 0)

  // Prepare pie data for expense breakdown
  const pieData = useMemo(() => {
    if (!stats) return []
    return stats.expenseBreakdown.map((item) => ({
      name: item.tag,
      value: item.amountMinor / 100,
      // Color will be generated by ExpenseBreakdownPie component
    }))
  }, [stats])

  // Prepare bar data for income vs expense
  const incomeMajor = stats ? stats.summary.totalIncome.amountMinor / 100 : 0
  const expenseMajor = stats ? stats.summary.totalExpense.amountMinor / 100 : 0

  // Calculate expense percentage relative to income
  const expensePercentage = useMemo(() => {
    if (!stats || stats.summary.totalIncome.amountMinor === 0) {
      return null
    }
    return (stats.summary.totalExpense.amountMinor / stats.summary.totalIncome.amountMinor) * 100
  }, [stats])

  // Filter transactions that match the current statistics filters
  const filteredTransactions = useMemo(() => {
    if (!profileTransactions.length || !currency) return []
    
    // Compare dates as strings in YYYY-MM-DD format to avoid timezone issues
    // Extract just the date part from the transaction's occurredAt in local timezone
    return profileTransactions
      .filter((t) => {
        // Convert transaction date to YYYY-MM-DD in local timezone
        const transactionDate = format(parseISO(t.occurredAt), 'yyyy-MM-dd')
        const inDateRange = transactionDate >= dateRange.from && transactionDate <= dateRange.to
        
        if (includeConverted) {
          // Include all currencies when conversion is enabled
          return inDateRange
        } else {
          // Only include transactions in the selected currency
          return inDateRange && t.currency === currency
        }
      })
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
  }, [profileTransactions, dateRange.from, dateRange.to, currency, includeConverted])

  const shouldShowSkeleton =
    isLoadingTransactions || isLoading || (!currency && derivedCurrencyOptions.length > 0)
  const shouldShowEmptyState = !shouldShowSkeleton && (!currency || !hasData)

  const filtersKey = useMemo(
    () =>
      `${advancedDateSearch ? 'advanced' : 'ym'}-${selectedYear}-${selectedMonth}-${currency || 'none'}-${
        includeConverted ? 'with-conversions' : 'base'
      }-${dateRange.from}-${dateRange.to}`,
    [advancedDateSearch, selectedYear, selectedMonth, currency, includeConverted, dateRange.from, dateRange.to]
  )

  const statsView = useMemo(() => {
    if (shouldShowSkeleton) {
      return {
        key: `loading-${filtersKey}`,
        node: (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Grid container spacing={2}>
              {[0, 1, 2, 3].map((item) => (
                <Grid key={item} size={{ xs: 12, md: 3 }} sx={{ minWidth: 0 }}>
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
              <Grid size={{ xs: 12, md: 3 }} sx={{ minWidth: 0 }}>
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
              <Grid size={{ xs: 12, md: 3 }} sx={{ minWidth: 0 }}>
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
              <Grid size={{ xs: 12, md: 3 }} sx={{ minWidth: 0 }}>
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
              <Grid size={{ xs: 12, md: 3 }} sx={{ minWidth: 0 }}>
                <Card sx={{ borderLeft: '4px solid', borderColor: expensePercentage !== null && expensePercentage > 100 ? 'error.main' : expensePercentage !== null && expensePercentage > 80 ? 'warning.main' : 'info.main' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Expense / Income
                    </Typography>
                    <Typography
                      variant="h5"
                      color={expensePercentage !== null && expensePercentage > 100 ? 'error.main' : expensePercentage !== null && expensePercentage > 80 ? 'warning.main' : 'info.main'}
                    >
                      {expensePercentage !== null ? `${expensePercentage.toFixed(1)}%` : 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </AnimatedSection>

          <AnimatedSection delay={120}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 7 }} sx={{ minWidth: 0 }}>
                <ExpenseBreakdownPie items={pieData} height={420} />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }} sx={{ minWidth: 0 }}>
                <IncomeExpenseBar income={incomeMajor} expense={expenseMajor} currency={currency} />
              </Grid>
            </Grid>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <Paper elevation={2} sx={{ mt: 3 }}>
              <Accordion expanded>
                <AccordionSummary>
                  <Typography variant="h6">
                    Underlying Transactions ({filteredTransactions.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {filteredTransactions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No transactions match the current filters.
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Tags</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell>Currency</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredTransactions.map((transaction) => (
                            <TableRow
                              key={transaction.id}
                              hover
                              onClick={() => router.push(`/transactions/${transaction.id}/edit`)}
                              sx={{ cursor: 'pointer' }}
                            >
                              <TableCell>
                                {format(parseISO(transaction.occurredAt), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={transaction.type}
                                  size="small"
                                  color={transaction.type === 'expense' ? 'error' : 'success'}
                                  sx={{ textTransform: 'capitalize' }}
                                />
                              </TableCell>
                              <TableCell>
                                {transaction.note || <em>No description</em>}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {transaction.tags.map((tagName) => {
                                    const tag = tags.find((t) => t.name === tagName)
                                    if (tag) {
                                      return <TagChip key={tag.id} tag={tag} size="small" />
                                    }
                                    return (
                                      <Chip
                                        key={tagName}
                                        label={tagName}
                                        size="small"
                                        sx={{
                                          border: `2px solid ${transaction.type === 'expense' ? '#c62828' : '#2e7d32'}`,
                                        }}
                                      />
                                    )
                                  })}
                                </Box>
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  color:
                                    transaction.type === 'expense' ? 'error.main' : 'success.main',
                                  fontWeight: 'bold',
                                }}
                              >
                                {transaction.type === 'expense' ? '-' : '+'}
                                {formatAmount(transaction.amountMinor, transaction.currency)}
                              </TableCell>
                              <TableCell>
                                {transaction.currency}
                                {includeConverted && transaction.currency !== currency && (
                                  <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                    (converted)
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </AccordionDetails>
              </Accordion>
            </Paper>
          </AnimatedSection>
        </>
      ),
    }
  }, [currency, expenseMajor, expensePercentage, filtersKey, incomeMajor, pieData, shouldShowEmptyState, shouldShowSkeleton, stats, filteredTransactions, tags, includeConverted])

  const bannerActions = (
    <Button
      variant="contained"
      color="primary"
      onClick={() => router.push('/')}
    >
      Back to Dashboard
    </Button>
  )

  if (!activeProfile) {
    return (
      <PageLayout pageName="Statistics" bannerActions={bannerActions}>
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
    <PageLayout pageName="Statistics" bannerActions={bannerActions}>
      <Container maxWidth="lg">
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
              {!advancedDateSearch && (
                <>
                  <FormControl sx={{ minWidth: 140 }}>
                    <InputLabel>Year</InputLabel>
                    <Select
                      value={selectedYear}
                      label="Year"
                      onChange={(e) => {
                        const newYear = Number(e.target.value)
                        setSelectedYear(newYear)
                        if (!advancedDateSearch) {
                          const nextRange = computeRangeFromYearMonth(newYear, selectedMonth)
                          setDateRange(nextRange)
                          setQueryParams({
                            year: String(newYear),
                            month: selectedMonth === 'all' ? 'all' : String(selectedMonth),
                            from: nextRange.from,
                            to: nextRange.to,
                            advanced: undefined,
                          })
                        } else {
                          setQueryParams({
                            year: String(newYear),
                            month: selectedMonth === 'all' ? 'all' : String(selectedMonth),
                          })
                        }
                      }}
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
                        {
                          const newMonth = e.target.value === 'all' ? 'all' : Number(e.target.value)
                          setSelectedMonth(newMonth)
                          if (!advancedDateSearch) {
                            const nextRange = computeRangeFromYearMonth(selectedYear, newMonth)
                            setDateRange(nextRange)
                            setQueryParams({
                              year: String(selectedYear),
                              month: newMonth === 'all' ? 'all' : String(newMonth),
                              from: nextRange.from,
                              to: nextRange.to,
                              advanced: undefined,
                            })
                          } else {
                            setQueryParams({
                              year: String(selectedYear),
                              month: newMonth === 'all' ? 'all' : String(newMonth),
                            })
                          }
                        }
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
                </>
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={advancedDateSearch}
                    onChange={(e) => {
                      const enabled = e.target.checked
                      setAdvancedDateSearch(enabled)
                      setQueryParams({
                        advanced: enabled ? 'true' : undefined,
                        from: dateRange.from,
                        to: dateRange.to,
                        year: String(selectedYear),
                        month: selectedMonth === 'all' ? 'all' : String(selectedMonth),
                      })
                    }}
                  />
                }
                label="Advanced date search (use exact dates)"
              />

              {advancedDateSearch && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ minWidth: 300 }}>
                  <TextField
                    label="From"
                    type="date"
                    value={advancedFrom}
                    onChange={(e) => {
                      const val = e.target.value
                      setAdvancedFrom(val)
                      if (advancedDateSearch && val) {
                        setDateRange((prev) => ({ ...prev, from: val }))
                        setQueryParams({
                          from: val,
                          to: dateRange.to,
                          advanced: 'true',
                        })
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 150 }}
                  />
                  <TextField
                    label="To"
                    type="date"
                    value={advancedTo}
                    onChange={(e) => {
                      const val = e.target.value
                      setAdvancedTo(val)
                      if (advancedDateSearch && val) {
                        setDateRange((prev) => ({ ...prev, to: val }))
                        setQueryParams({
                          from: dateRange.from,
                          to: val,
                          advanced: 'true',
                        })
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 150 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const start = format(startOfMonth(new Date()), 'yyyy-MM-dd')
                      const end = format(endOfMonth(new Date()), 'yyyy-MM-dd')
                      setAdvancedFrom(start)
                      setAdvancedTo(end)
                      setDateRange({ from: start, to: end })
                      setQueryParams({
                        from: start,
                        to: end,
                        advanced: 'true',
                      })
                    }}
                  >
                    Reset Range
                  </Button>
                </Stack>
              )}

              {advancedDateSearch && (
                <>
                  <FormControl sx={{ minWidth: 180 }} disabled={currencyOptions.length === 0}>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={currency}
                      label="Currency"
                      onChange={(e) => {
                        const val = String(e.target.value)
                        updateCurrency(val)
                      }}
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
                    onChange={(event) => {
                      const checked = event.target.checked
                      setIncludeConverted(checked)
                      setQueryParams({ includeConverted: checked ? 'true' : undefined })
                    }}
                        disabled={!currency}
                      />
                    }
                    label="Include other currencies (convert to selected currency)"
                  />
                </>
              )}
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


