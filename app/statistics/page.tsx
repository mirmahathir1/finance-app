'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { PageLayout } from '@/components/PageLayout'
import { Snackbar } from '@/components/Snackbar'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { AnimatedSection } from '@/components/AnimatedSection'
import { StatisticsCalendar } from '@/components/StatisticsCalendar'
import { StatisticsDayTransactionsDialog } from '@/components/StatisticsDayTransactionsDialog'
import { StatisticsTransactionsTable } from '@/components/StatisticsTransactionsTable'
import { useProfile } from '@/contexts/ProfileContext'
import { useTag } from '@/contexts/TagContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useApi } from '@/utils/useApi'
import { formatAmount } from '@/utils/amount'
import { getFriendlyErrorMessage } from '@/utils/error'
import {
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from 'date-fns'
import type { StatisticsCalendarData, StatisticsData, Transaction, TransactionType } from '@/types'

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

function isValidMonth(value?: string | null) {
  return Boolean(value && /^\d{4}-\d{2}$/.test(value))
}

function isValidDate(value?: string | null) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))
}

function isValidTransactionType(value?: string | null): value is TransactionType {
  return value === 'expense' || value === 'income'
}

function normalizeRange(from: string, to: string) {
  return from <= to ? { from, to } : { from: to, to: from }
}

function getMonthBounds(month: string) {
  const monthDate = parseISO(`${month}-01`)
  return {
    from: format(startOfMonth(monthDate), 'yyyy-MM-dd'),
    to: format(endOfMonth(monthDate), 'yyyy-MM-dd'),
  }
}

function getDisplayAmountMinor(transaction: Transaction) {
  return transaction.displayAmountMinor ?? transaction.amountMinor
}

export default function StatisticsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const api = useApi()
  const { activeProfile } = useProfile()
  const { tags } = useTag()
  const { defaultCurrency } = useCurrency()

  const currentMonth = useMemo(() => format(new Date(), 'yyyy-MM'), [])
  const defaultRange = useMemo(() => getMonthBounds(currentMonth), [currentMonth])

  const [hasInitializedFromUrl, setHasInitializedFromUrl] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(currentMonth)
  const [selectedRange, setSelectedRange] = useState(defaultRange)
  const [pendingRangeStart, setPendingRangeStart] = useState<string | null>(null)
  const [hasCommittedRangeSelection, setHasCommittedRangeSelection] = useState(false)
  const [currency, setCurrency] = useState('')
  const [includeConverted, setIncludeConverted] = useState(false)
  const [currencyOptions, setCurrencyOptions] = useState<string[]>([])
  const [profileTransactions, setProfileTransactions] = useState<Transaction[]>([])
  const [summaryTransactions, setSummaryTransactions] = useState<Transaction[]>([])
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false)
  const [isLoadingSummaryTransactions, setIsLoadingSummaryTransactions] = useState(false)
  const [allowInitialActivityAutofocus, setAllowInitialActivityAutofocus] = useState(true)
  const [didAutofocusActivityMonth, setDidAutofocusActivityMonth] = useState(false)

  const [calendarData, setCalendarData] = useState<StatisticsCalendarData | null>(null)
  const [stats, setStats] = useState<StatisticsData | null>(null)
  const [rangeTransactions, setRangeTransactions] = useState<Transaction[]>([])
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false)
  const [isLoadingRange, setIsLoadingRange] = useState(false)
  const [calendarError, setCalendarError] = useState<string | null>(null)
  const [rangeError, setRangeError] = useState<string | null>(null)

  const [dialogState, setDialogState] = useState<{
    open: boolean
    date: string | null
    type: TransactionType | null
  }>({
    open: false,
    date: null,
    type: null,
  })
  const [dayTransactions, setDayTransactions] = useState<Transaction[]>([])
  const [isLoadingDayTransactions, setIsLoadingDayTransactions] = useState(false)

  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  const closeDayDialog = useCallback(() => {
    setDialogState({ open: false, date: null, type: null })
  }, [])

  const showSkippedCurrencies = useCallback((codes?: string[]) => {
    if (!codes || codes.length === 0) {
      return
    }

    setSnackbar({
      open: true,
      severity: 'warning',
      message: `Missing exchange rates for: ${codes.join(', ')}`,
    })
  }, [])

  useEffect(() => {
    if (hasInitializedFromUrl) return

    const monthParam = searchParams?.get('month')
    const fromParam = searchParams?.get('from')
    const toParam = searchParams?.get('to')
    const currencyParam = searchParams?.get('currency')
    const includeConvertedParam = searchParams?.get('includeConverted') === 'true'
    const dialogDateParam = searchParams?.get('dialogDate')
    const dialogTypeParam = searchParams?.get('dialogType')
    const nextDialogDate = isValidDate(dialogDateParam) ? dialogDateParam! : null
    const nextDialogType = isValidTransactionType(dialogTypeParam) ? dialogTypeParam : null
    const nextDialogState =
      nextDialogDate && nextDialogType
        ? {
            open: true,
            date: nextDialogDate,
            type: nextDialogType,
          }
        : {
            open: false,
            date: null,
            type: null,
          }

    const nextVisibleMonth = isValidMonth(monthParam)
      ? monthParam!
      : nextDialogState.open && nextDialogState.date
        ? nextDialogState.date.slice(0, 7)
        : currentMonth
    const fallbackRange = getMonthBounds(nextVisibleMonth)
    const nextRange =
      isValidDate(fromParam) && isValidDate(toParam)
        ? normalizeRange(fromParam!, toParam!)
        : fallbackRange

    setVisibleMonth(nextVisibleMonth)
    setSelectedRange(nextRange)
    setCurrency(currencyParam?.toUpperCase() || '')
    setIncludeConverted(includeConvertedParam)
    setDialogState(nextDialogState)
    setAllowInitialActivityAutofocus(!isValidMonth(monthParam) && !(isValidDate(fromParam) && isValidDate(toParam)))
    setHasInitializedFromUrl(true)
  }, [currentMonth, hasInitializedFromUrl, searchParams])

  useEffect(() => {
    if (!hasInitializedFromUrl) return

    const dialogDateParam = searchParams?.get('dialogDate')
    const dialogTypeParam = searchParams?.get('dialogType')
    const nextDialogDate = isValidDate(dialogDateParam) ? dialogDateParam! : null
    const nextDialogType = isValidTransactionType(dialogTypeParam) ? dialogTypeParam : null
    const nextDialogState =
      nextDialogDate && nextDialogType
        ? {
            open: true,
            date: nextDialogDate,
            type: nextDialogType,
          }
        : {
            open: false,
            date: null,
            type: null,
          }

    setDialogState((current) => {
      if (
        current.open === nextDialogState.open &&
        current.date === nextDialogState.date &&
        current.type === nextDialogState.type
      ) {
        return current
      }

      return nextDialogState
    })
  }, [hasInitializedFromUrl, searchParams])

  useEffect(() => {
    if (!hasInitializedFromUrl) return

    const params = new URLSearchParams()
    params.set('month', visibleMonth)
    params.set('from', selectedRange.from)
    params.set('to', selectedRange.to)

    if (currency) {
      params.set('currency', currency)
    }

    if (includeConverted) {
      params.set('includeConverted', 'true')
    }

    if (dialogState.open && dialogState.date && dialogState.type) {
      params.set('dialogDate', dialogState.date)
      params.set('dialogType', dialogState.type)
    }

    router.replace(`?${params.toString()}`)
  }, [
    currency,
    dialogState.date,
    dialogState.open,
    dialogState.type,
    hasInitializedFromUrl,
    includeConverted,
    router,
    selectedRange.from,
    selectedRange.to,
    visibleMonth,
  ])

  useEffect(() => {
    if (!activeProfile) {
      setCurrencyOptions([])
      setProfileTransactions([])
      setCurrency('')
      return
    }

    let cancelled = false

    const loadProfileCurrencies = async () => {
      try {
        setIsLoadingCurrencies(true)
        const response = await api.getTransactions({ profile: activeProfile })

        if (!response.success || !response.data) {
          throw new Error(
            !response.success ? response.error.message : 'Failed to load currencies.'
          )
        }

        const profileItems = response.data.transactions

        const nextOptions = Array.from(
          new Set(profileItems.map((transaction) => transaction.currency))
        ).sort()

        if (!cancelled) {
          setProfileTransactions(profileItems)
          setCurrencyOptions(nextOptions)
        }
      } catch (error) {
        if (!cancelled) {
          setProfileTransactions([])
          setCurrencyOptions([])
          setSnackbar({
            open: true,
            severity: 'error',
            message: getFriendlyErrorMessage(error, 'Failed to load profile currencies.'),
          })
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCurrencies(false)
        }
      }
    }

    loadProfileCurrencies()

    return () => {
      cancelled = true
    }
  }, [activeProfile, api])

  useEffect(() => {
    if (!hasInitializedFromUrl) return

    if (currencyOptions.length === 0) {
      setCurrency('')
      return
    }

    if (currency && currencyOptions.includes(currency)) {
      return
    }

    if (defaultCurrency?.code && currencyOptions.includes(defaultCurrency.code)) {
      setCurrency(defaultCurrency.code)
      return
    }

    setCurrency(currencyOptions[0])
  }, [currency, currencyOptions, defaultCurrency?.code, hasInitializedFromUrl])

  const latestActivityMonth = useMemo(() => {
    const candidates = profileTransactions
      .filter((transaction) => includeConverted || !currency || transaction.currency === currency)
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))

    return candidates[0]?.occurredAt.slice(0, 7) || null
  }, [currency, includeConverted, profileTransactions])

  useEffect(() => {
    if (!activeProfile || !currency) {
      setSummaryTransactions([])
      setIsLoadingSummaryTransactions(false)
      return
    }

    let cancelled = false

    const loadSummaryTransactions = async () => {
      try {
        setIsLoadingSummaryTransactions(true)
        const response = await api.getTransactions({
          profile: activeProfile,
          currency,
          displayCurrency: currency,
          includeConverted,
          sort: 'desc',
        })

        if (!response.success || !response.data) {
          throw new Error(
            !response.success ? response.error.message : 'Failed to load period summaries.'
          )
        }

        if (!cancelled) {
          setSummaryTransactions(response.data.transactions)
        }
      } catch (error) {
        if (!cancelled) {
          setSummaryTransactions([])
          setSnackbar({
            open: true,
            severity: 'error',
            message: getFriendlyErrorMessage(error, 'Failed to load period summaries.'),
          })
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSummaryTransactions(false)
        }
      }
    }

    loadSummaryTransactions()

    return () => {
      cancelled = true
    }
  }, [activeProfile, api, currency, includeConverted])

  const visibleYear = useMemo(() => {
    return Number.parseInt(visibleMonth.slice(0, 4), 10)
  }, [visibleMonth])

  const yearSummaryOptions = useMemo(() => {
    const totalsByYear = new Map<
      number,
      { totalIncomeMinor: number; totalExpenseMinor: number }
    >()

    for (const transaction of summaryTransactions) {
      const year = Number.parseInt(transaction.occurredAt.slice(0, 4), 10)
      const nextTotals = totalsByYear.get(year) || {
        totalIncomeMinor: 0,
        totalExpenseMinor: 0,
      }
      const amountMinor = getDisplayAmountMinor(transaction)

      if (transaction.type === 'income') {
        nextTotals.totalIncomeMinor += amountMinor
      } else {
        nextTotals.totalExpenseMinor += amountMinor
      }

      totalsByYear.set(year, nextTotals)
    }

    if (!totalsByYear.has(visibleYear)) {
      totalsByYear.set(visibleYear, {
        totalIncomeMinor: 0,
        totalExpenseMinor: 0,
      })
    }

    return Array.from(totalsByYear.entries())
      .sort((left, right) => right[0] - left[0])
      .map(([year, totals]) => ({
        year,
        totalIncomeMinor: totals.totalIncomeMinor,
        totalExpenseMinor: totals.totalExpenseMinor,
      }))
  }, [summaryTransactions, visibleYear])

  const monthSummaryOptions = useMemo(() => {
    const totalsByMonth = Array.from({ length: 12 }, (_, monthIndex) => ({
      monthIndex,
      label: format(new Date(visibleYear, monthIndex, 1), 'MMMM'),
      totalIncomeMinor: 0,
      totalExpenseMinor: 0,
    }))

    for (const transaction of summaryTransactions) {
      const transactionYear = Number.parseInt(transaction.occurredAt.slice(0, 4), 10)
      if (transactionYear !== visibleYear) {
        continue
      }

      const monthIndex = Number.parseInt(transaction.occurredAt.slice(5, 7), 10) - 1
      const amountMinor = getDisplayAmountMinor(transaction)

      if (transaction.type === 'income') {
        totalsByMonth[monthIndex].totalIncomeMinor += amountMinor
      } else {
        totalsByMonth[monthIndex].totalExpenseMinor += amountMinor
      }
    }

    return totalsByMonth
  }, [summaryTransactions, visibleYear])

  const loadCalendarData = useCallback(async () => {
    if (!activeProfile || !currency) {
      setCalendarData(null)
      setCalendarError(null)
      return
    }

    try {
      setIsLoadingCalendar(true)
      setCalendarError(null)
      const response = await api.getStatisticsCalendar({
        profile: activeProfile,
        month: visibleMonth,
        currency,
        includeConverted,
      })

      if (!response.success || !response.data) {
        throw new Error(
          !response.success ? response.error.message : 'Failed to load calendar statistics.'
        )
      }

      setCalendarData(response.data)
      showSkippedCurrencies(response.data.meta?.skippedCurrencies)
    } catch (error) {
      setCalendarData(null)
      setCalendarError(
        getFriendlyErrorMessage(error, 'Failed to load calendar statistics.')
      )
    } finally {
      setIsLoadingCalendar(false)
    }
  }, [activeProfile, api, currency, includeConverted, showSkippedCurrencies, visibleMonth])

  const loadRangeData = useCallback(async () => {
    if (!activeProfile || !currency) {
      setStats(null)
      setRangeTransactions([])
      setRangeError(null)
      return
    }

    try {
      setIsLoadingRange(true)
      setRangeError(null)

      const [statsResponse, transactionsResponse] = await Promise.all([
        api.getStatistics({
          profile: activeProfile,
          from: selectedRange.from,
          to: selectedRange.to,
          currency,
          includeConverted,
        }),
        api.getTransactions({
          profile: activeProfile,
          from: selectedRange.from,
          to: selectedRange.to,
          currency,
          displayCurrency: currency,
          includeConverted,
          sort: 'desc',
        }),
      ])

      if (!statsResponse.success || !statsResponse.data) {
        throw new Error(
          !statsResponse.success ? statsResponse.error.message : 'Failed to load statistics.'
        )
      }

      if (!transactionsResponse.success || !transactionsResponse.data) {
        throw new Error(
          !transactionsResponse.success
            ? transactionsResponse.error.message
            : 'Failed to load transactions.'
        )
      }

      setStats(statsResponse.data)
      setRangeTransactions(transactionsResponse.data.transactions)

      showSkippedCurrencies([
        ...(statsResponse.data.meta?.skippedCurrencies || []),
        ...(transactionsResponse.data.meta?.skippedCurrencies || []),
      ])
    } catch (error) {
      setStats(null)
      setRangeTransactions([])
      setRangeError(getFriendlyErrorMessage(error, 'Failed to load statistics.'))
    } finally {
      setIsLoadingRange(false)
    }
  }, [
    activeProfile,
    api,
    currency,
    includeConverted,
    selectedRange.from,
    selectedRange.to,
    showSkippedCurrencies,
  ])

  useEffect(() => {
    if (!hasInitializedFromUrl) return
    loadCalendarData()
  }, [hasInitializedFromUrl, loadCalendarData])

  useEffect(() => {
    if (
      !hasInitializedFromUrl ||
      !allowInitialActivityAutofocus ||
      didAutofocusActivityMonth ||
      isLoadingCalendar ||
      !currency ||
      !latestActivityMonth ||
      latestActivityMonth === visibleMonth
    ) {
      return
    }

    if (calendarData && calendarData.days.length === 0) {
      setVisibleMonth(latestActivityMonth)
      setSelectedRange(getMonthBounds(latestActivityMonth))
      setDidAutofocusActivityMonth(true)
      setSnackbar({
        open: true,
        severity: 'info',
        message: `Showing the latest month with activity: ${format(parseISO(`${latestActivityMonth}-01`), 'MMMM yyyy')}.`,
      })
    }
  }, [
    allowInitialActivityAutofocus,
    calendarData,
    currency,
    didAutofocusActivityMonth,
    hasInitializedFromUrl,
    isLoadingCalendar,
    latestActivityMonth,
    visibleMonth,
  ])

  useEffect(() => {
    if (!hasInitializedFromUrl) return
    loadRangeData()
  }, [hasInitializedFromUrl, loadRangeData])

  useEffect(() => {
    if (!dialogState.open || !dialogState.date || !dialogState.type || !activeProfile || !currency) {
      if (!dialogState.open) {
        setDayTransactions([])
      }
      return
    }

    let cancelled = false

    const loadDayTransactions = async () => {
      try {
        setIsLoadingDayTransactions(true)
        const response = await api.getTransactions({
          profile: activeProfile,
          from: dialogState.date ?? undefined,
          to: dialogState.date ?? undefined,
          type: dialogState.type ?? undefined,
          currency,
          displayCurrency: currency,
          includeConverted,
          sort: 'asc',
        })

        if (!response.success || !response.data) {
          throw new Error(
            !response.success ? response.error.message : 'Failed to load transactions.'
          )
        }

        if (!cancelled) {
          setDayTransactions(response.data.transactions)
          showSkippedCurrencies(response.data.meta?.skippedCurrencies)
        }
      } catch (error) {
        if (!cancelled) {
          setDayTransactions([])
          setSnackbar({
            open: true,
            severity: 'error',
            message: getFriendlyErrorMessage(error, 'Failed to load day transactions.'),
          })
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDayTransactions(false)
        }
      }
    }

    loadDayTransactions()

    return () => {
      cancelled = true
    }
  }, [activeProfile, api, currency, dialogState.date, dialogState.open, dialogState.type, includeConverted, showSkippedCurrencies])

  const handleDateSelect = useCallback((date: string) => {
    if (!pendingRangeStart) {
      setPendingRangeStart(date)
      setHasCommittedRangeSelection(false)
      return
    }

    setSelectedRange(normalizeRange(pendingRangeStart, date))
    setPendingRangeStart(null)
    setHasCommittedRangeSelection(true)
  }, [pendingRangeStart])

  const handleEventClick = useCallback((date: string, type: TransactionType) => {
    setDialogState({
      open: true,
      date,
      type,
    })
  }, [])

  const pieData = useMemo(() => {
    if (!stats) return []
    return stats.expenseBreakdown.map((item) => ({
      name: item.tag,
      value: item.amountMinor / 100,
    }))
  }, [stats])

  const incomeMajor = stats ? stats.summary.totalIncome.amountMinor / 100 : 0
  const expenseMajor = stats ? stats.summary.totalExpense.amountMinor / 100 : 0

  const expensePercentage = useMemo(() => {
    if (!stats || stats.summary.totalIncome.amountMinor === 0) {
      return null
    }

    return (stats.summary.totalExpense.amountMinor / stats.summary.totalIncome.amountMinor) * 100
  }, [stats])

  const hasRangeData = Boolean(
    stats &&
      (stats.summary.totalIncome.amountMinor > 0 ||
        stats.summary.totalExpense.amountMinor > 0)
  )

  const summaryCardsContent = stats ? (
    <Stack spacing={2}>
      <Card sx={{ borderLeft: '4px solid', borderColor: 'success.main' }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">
            Total Income
          </Typography>
          <Typography variant="h5" color="success.main">
            {formatAmount(stats.summary.totalIncome.amountMinor, currency)}
          </Typography>
        </CardContent>
      </Card>
      <Card sx={{ borderLeft: '4px solid', borderColor: 'error.main' }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">
            Total Expense
          </Typography>
          <Typography variant="h5" color="error.main">
            {formatAmount(stats.summary.totalExpense.amountMinor, currency)}
          </Typography>
        </CardContent>
      </Card>
      <Card sx={{ borderLeft: '4px solid', borderColor: 'primary.main' }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">
            Net Balance
          </Typography>
          <Typography
            variant="h5"
            color={stats.summary.netBalance.amountMinor >= 0 ? 'success.main' : 'error.main'}
          >
            {formatAmount(stats.summary.netBalance.amountMinor, currency)}
          </Typography>
        </CardContent>
      </Card>
      <Card
        sx={{
          borderLeft: '4px solid',
          borderColor:
            expensePercentage !== null && expensePercentage > 100
              ? 'error.main'
              : expensePercentage !== null && expensePercentage > 80
                ? 'warning.main'
                : 'info.main',
        }}
      >
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">
            Expense / Income
          </Typography>
          <Typography
            variant="h5"
            color={
              expensePercentage !== null && expensePercentage > 100
                ? 'error.main'
                : expensePercentage !== null && expensePercentage > 80
                  ? 'warning.main'
                  : 'info.main'
            }
          >
            {expensePercentage !== null ? `${expensePercentage.toFixed(1)}%` : 'N/A'}
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  ) : null

  const summaryCardsSkeleton = (
    <Stack spacing={2}>
      {[0, 1, 2, 3].map((item) => (
        <Card key={item} sx={{ p: 2 }}>
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" height={36} />
        </Card>
      ))}
    </Stack>
  )

  const showDesktopSummaryColumn =
    !calendarError && (isLoadingRange || (!rangeError && Boolean(currency) && hasRangeData))

  const selectedRangeLabel = useMemo(() => {
    return `${format(parseISO(selectedRange.from), 'MMM d, yyyy')} - ${format(
      parseISO(selectedRange.to),
      'MMM d, yyyy'
    )}`
  }, [selectedRange.from, selectedRange.to])

  const selectionStatusText = useMemo(() => {
    if (pendingRangeStart) {
      return 'Pick end date'
    }

    if (hasCommittedRangeSelection) {
      return `Selected range: ${selectedRangeLabel}`
    }

    return 'Select to pick starting date for filter'
  }, [hasCommittedRangeSelection, pendingRangeStart, selectedRangeLabel])

  const selectionSecondaryText = useMemo(() => {
    if (pendingRangeStart || hasCommittedRangeSelection) {
      return undefined
    }

    return `Active date range: ${selectedRangeLabel}`
  }, [hasCommittedRangeSelection, pendingRangeStart, selectedRangeLabel])

  const visibleMonthHasEvents = Boolean(
    calendarData?.days.some((day) => day.date.startsWith(`${visibleMonth}-`))
  )

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
        <AnimatedSection>
          <Grid container spacing={3} alignItems="flex-start">
            <Grid size={showDesktopSummaryColumn ? { xs: 12, md: 8 } : { xs: 12 }} sx={{ minWidth: 0 }}>
              {calendarError ? (
                <ErrorState
                  title="Unable to load calendar"
                  message={calendarError}
                  onRetry={loadCalendarData}
                />
              ) : (
                <StatisticsCalendar
                  visibleMonth={visibleMonth}
                  currency={currency || 'USD'}
                  currencyOptions={currencyOptions}
                  includeConverted={includeConverted}
                  yearSummaryOptions={yearSummaryOptions}
                  monthSummaryOptions={monthSummaryOptions}
                  days={calendarData?.days || []}
                  selectedRange={selectedRange}
                  pendingRangeStart={pendingRangeStart}
                  selectionStatusText={selectionStatusText}
                  selectionSecondaryText={selectionSecondaryText}
                  isLoading={isLoadingCalendar}
                  isLoadingCurrencies={isLoadingCurrencies}
                  isLoadingPeriodSummaries={isLoadingSummaryTransactions}
                  onMonthChange={setVisibleMonth}
                  onDateSelect={handleDateSelect}
                  onEventClick={handleEventClick}
                  onCurrencyChange={setCurrency}
                  onIncludeConvertedChange={setIncludeConverted}
                />
              )}
              {!calendarError && !isLoadingCalendar && currency && !visibleMonthHasEvents && (
                <Paper
                  elevation={0}
                  sx={{
                    mt: 1.5,
                    px: 2,
                    py: 1.25,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                  >
                    <Typography variant="body2" color="text.secondary">
                      No income or expense events were found for {format(parseISO(`${visibleMonth}-01`), 'MMMM yyyy')} in {currency}.
                    </Typography>
                    {latestActivityMonth && latestActivityMonth !== visibleMonth && (
                      <Button
                        size="small"
                        onClick={() => {
                          setVisibleMonth(latestActivityMonth)
                          setSelectedRange(getMonthBounds(latestActivityMonth))
                        }}
                      >
                        Jump To Latest Activity
                      </Button>
                    )}
                  </Stack>
                </Paper>
              )}
            </Grid>

            {showDesktopSummaryColumn && (
              <Grid
                size={{ xs: 12, md: 4 }}
                sx={{ display: { xs: 'none', md: 'block' }, minWidth: 0 }}
              >
                {isLoadingRange ? summaryCardsSkeleton : summaryCardsContent}
              </Grid>
            )}
          </Grid>
        </AnimatedSection>

        <AnimatedSection delay={40}>
          {rangeError ? (
            <Box sx={{ mt: 3 }}>
              <ErrorState
                title="Unable to load statistics"
                message={rangeError}
                onRetry={loadRangeData}
              />
            </Box>
          ) : isLoadingRange ? (
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {summaryCardsSkeleton}
              </Box>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Skeleton variant="text" width="30%" height={28} />
                <Skeleton variant="rectangular" height={240} sx={{ mt: 2, borderRadius: 1 }} />
              </Paper>
            </Box>
          ) : !currency ? (
            <Box sx={{ mt: 3 }}>
              <EmptyState
                title="No currencies found"
                message="No transaction currencies are available for the active profile."
              />
            </Box>
          ) : !hasRangeData ? (
            <Box sx={{ mt: 3 }}>
              <EmptyState
                title="No statistics available"
                message="No transactions match the selected range and currency."
              />
            </Box>
          ) : (
            <>
              <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 3 }}>
                {summaryCardsContent}
              </Box>

              <Grid container spacing={3} sx={{ mt: 3 }}>
                <Grid size={{ xs: 12, md: 7 }} sx={{ minWidth: 0 }}>
                  <ExpenseBreakdownPie items={pieData} height={420} />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }} sx={{ minWidth: 0 }}>
                  <IncomeExpenseBar income={incomeMajor} expense={expenseMajor} currency={currency} />
                </Grid>
              </Grid>

              <Paper elevation={2} sx={{ mt: 3 }}>
                <Box sx={{ px: 3, pt: 3 }}>
                  <Typography variant="h6">
                    Underlying Transactions ({rangeTransactions.length})
                  </Typography>
                </Box>
                <StatisticsTransactionsTable
                  transactions={rangeTransactions}
                  tags={tags}
                  onTransactionClick={(transactionId) => {
                    router.push(`/transactions/${transactionId}/edit`)
                  }}
                />
              </Paper>
            </>
          )}
        </AnimatedSection>

        <StatisticsDayTransactionsDialog
          open={dialogState.open}
          date={dialogState.date}
          type={dialogState.type}
          transactions={dayTransactions}
          tags={tags}
          isLoading={isLoadingDayTransactions}
          onClose={closeDayDialog}
          onTransactionClick={(transactionId) => {
            router.push(`/transactions/${transactionId}/edit`)
          }}
        />

        <Snackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        />
      </Container>
    </PageLayout>
  )
}
