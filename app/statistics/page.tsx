'use client'

import { useEffect, useMemo, useState } from 'react'
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
  CircularProgress,
  Grid,
  Card,
  CardContent,
} from '@mui/material'
import { PageLayout } from '@/components/PageLayout'
import { Snackbar } from '@/components/Snackbar'
import { EmptyState } from '@/components/EmptyState'
import { useProfile } from '@/contexts/ProfileContext'
import { useApi } from '@/utils/useApi'
import { formatAmount } from '@/utils/amount'
import { startOfMonth, endOfMonth } from 'date-fns'
import type { StatisticsData, Transaction } from '@/types'
import { ExpenseBreakdownPie } from '@/components/ExpenseBreakdownPie'
import { IncomeExpenseBar } from '@/components/IncomeExpenseBar'

const EXPENSE_COLORS = ['#e53935', '#d32f2f', '#ef5350', '#f44336', '#ff7043', '#ff8a65']

export default function StatisticsPage() {
  const router = useRouter()
  const { activeProfile } = useProfile()
  const api = useApi()

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

  // Data
  const [stats, setStats] = useState<StatisticsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  // Load available years and initialize filters
  useEffect(() => {
    const init = async () => {
      if (!activeProfile) return
      try {
        const txRes = await api.getTransactions({ profile: activeProfile })
        if (txRes.success && txRes.data) {
          const txs = txRes.data.transactions as Transaction[]
          const yearSet = new Set<number>()
          txs.forEach((t) => {
            const year = new Date(t.occurredAt).getFullYear()
            yearSet.add(year)
          })
          const derivedYears = Array.from(yearSet).sort((a, b) => b - a)
          const fallbackYears =
            derivedYears.length > 0
              ? derivedYears
              : [new Date().getFullYear()]
          setYears(fallbackYears)
          // Initialize year to most recent
          setSelectedYear(fallbackYears[0])
        }
      } catch (e) {
        // On failure, fall back to current year
        setYears([new Date().getFullYear()])
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile])

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

  // Update currency options when period changes
  useEffect(() => {
    const loadCurrenciesForPeriod = async () => {
      if (!activeProfile) return
      try {
        const txRes = await api.getTransactions({
          profile: activeProfile,
          from,
          to,
        })
        if (txRes.success && txRes.data) {
          const txs = txRes.data.transactions as Transaction[]
          const setCodes = new Set<string>()
          txs.forEach((t) => {
            if (t.currency) setCodes.add(t.currency)
          })
          const options = Array.from(setCodes).sort()
          setCurrencyOptions(options)
          if (!options.includes(currency)) {
            setCurrency(options[0] || '')
          }
        }
      } catch (e) {
        setCurrencyOptions([])
        setCurrency('')
      }
    }
    loadCurrenciesForPeriod()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile, from, to])

  // Load statistics when filters are ready
  useEffect(() => {
    const loadStats = async () => {
      if (!activeProfile || !currency) {
        setStats(null)
        return
      }
      try {
        setIsLoading(true)
        const res = await api.getStatistics({
          profile: activeProfile,
          from,
          to,
          currency,
        })
        if (res.success && res.data) {
          setStats(res.data)
        } else {
          setStats(null)
        }
      } catch (error: any) {
        setStats(null)
        setSnackbar({
          open: true,
          message: error?.message || 'Failed to load statistics',
          severity: 'error',
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile, from, to, currency])

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
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Statistics</Typography>
          <Button variant="outlined" onClick={() => router.push('/')}>
            Back to Dashboard
          </Button>
        </Box>

        {/* Filters */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
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
          </Stack>
        </Paper>

        {/* Content */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : !currency || !hasData ? (
          <EmptyState
            title="No statistics available"
            message={
              !currency
                ? 'No currencies found for the selected period.'
                : 'No data for the selected filters.'
            }
          />
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 4 }}>
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
              <Grid size={{ xs: 12, md: 4 }}>
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
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ borderLeft: '4px solid', borderColor: 'primary.main' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Net Balance
                    </Typography>
                    <Typography
                      variant="h5"
                      color={
                        stats!.summary.netBalance.amountMinor >= 0 ? 'success.main' : 'error.main'
                      }
                    >
                      {formatAmount(stats!.summary.netBalance.amountMinor, currency)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 12 }}>
                <ExpenseBreakdownPie items={pieData} height={420} />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <IncomeExpenseBar
                  income={incomeMajor}
                  expense={expenseMajor}
                  currency={currency}
                />
              </Grid>
            </Grid>
          </>
        )}

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


