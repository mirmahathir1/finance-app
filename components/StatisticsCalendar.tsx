'use client'

import { useMemo, useState, type MouseEvent } from 'react'
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import {
  ArrowDropDown as ArrowDropDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { StatisticsCalendarDay, TransactionType } from '@/types'

interface StatisticsCalendarProps {
  visibleMonth: string
  currency: string
  currencyOptions: string[]
  includeConverted: boolean
  yearSummaryOptions: Array<{
    year: number
    totalIncomeMinor: number
    totalExpenseMinor: number
  }>
  monthSummaryOptions: Array<{
    monthIndex: number
    label: string
    totalIncomeMinor: number
    totalExpenseMinor: number
  }>
  days: StatisticsCalendarDay[]
  selectedRange: { from: string; to: string }
  pendingRangeStart?: string | null
  selectionStatusText?: string
  selectionSecondaryText?: string
  isLoading?: boolean
  isLoadingCurrencies?: boolean
  isLoadingPeriodSummaries?: boolean
  onMonthChange: (month: string) => void
  onDateSelect: (date: string) => void
  onEventClick: (date: string, type: TransactionType) => void
  onCurrencyChange: (currency: string) => void
  onIncludeConvertedChange: (checked: boolean) => void
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatCompactAmount(amountMinor: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amountMinor / 100)
}

function eventLabel(amountMinor: number, currency: string) {
  return formatCompactAmount(amountMinor, currency)
}

function SummaryBreakdown({
  totalIncomeMinor,
  totalExpenseMinor,
  currency,
}: {
  totalIncomeMinor: number
  totalExpenseMinor: number
  currency: string
}) {
  return (
    <Stack spacing={0.2} alignItems="flex-end" sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{ color: 'success.main', fontWeight: 600, lineHeight: 1.2 }}
      >
        In {formatCompactAmount(totalIncomeMinor, currency)}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: 'error.main', fontWeight: 600, lineHeight: 1.2 }}
      >
        Out {formatCompactAmount(totalExpenseMinor, currency)}
      </Typography>
    </Stack>
  )
}

export function StatisticsCalendar({
  visibleMonth,
  currency,
  currencyOptions,
  includeConverted,
  yearSummaryOptions,
  monthSummaryOptions,
  days,
  selectedRange,
  pendingRangeStart,
  selectionStatusText,
  selectionSecondaryText,
  isLoading = false,
  isLoadingCurrencies = false,
  isLoadingPeriodSummaries = false,
  onMonthChange,
  onDateSelect,
  onEventClick,
  onCurrencyChange,
  onIncludeConvertedChange,
}: StatisticsCalendarProps) {
  const theme = useTheme()
  const [monthAnchorEl, setMonthAnchorEl] = useState<HTMLElement | null>(null)
  const [yearAnchorEl, setYearAnchorEl] = useState<HTMLElement | null>(null)
  const monthDate = useMemo(
    () => parseISO(`${visibleMonth}-01`),
    [visibleMonth]
  )

  const calendarDays = useMemo(() => {
    const intervalStart = startOfWeek(startOfMonth(monthDate))
    const intervalEnd = endOfWeek(endOfMonth(monthDate))
    return eachDayOfInterval({ start: intervalStart, end: intervalEnd })
  }, [monthDate])

  const dayMap = useMemo(() => {
    return new Map(days.map((day) => [day.date, day]))
  }, [days])

  const handleMonthPickerOpen = (event: MouseEvent<HTMLElement>) => {
    setMonthAnchorEl(event.currentTarget)
  }

  const handleYearPickerOpen = (event: MouseEvent<HTMLElement>) => {
    setYearAnchorEl(event.currentTarget)
  }

  const handleMonthSelect = (monthIndex: number) => {
    onMonthChange(format(new Date(monthDate.getFullYear(), monthIndex, 1), 'yyyy-MM'))
    setMonthAnchorEl(null)
  }

  const handleYearSelect = (year: number) => {
    onMonthChange(format(new Date(year, monthDate.getMonth(), 1), 'yyyy-MM'))
    setYearAnchorEl(null)
  }

  return (
    <Paper
      elevation={2}
      sx={{
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
        >
          <Stack
            direction="row"
            spacing={0.35}
            alignItems="center"
            sx={{ flexWrap: 'wrap' }}
          >
            <Button
              variant="text"
              endIcon={<ArrowDropDownIcon />}
              onClick={handleYearPickerOpen}
              sx={{
                minWidth: 0,
                px: 0.25,
                color: 'text.primary',
                fontSize: { xs: '1.3rem', sm: '1.55rem' },
                fontWeight: 600,
                letterSpacing: '-0.02em',
                textTransform: 'none',
              }}
            >
              {format(monthDate, 'yyyy')}
            </Button>
            <Typography
              component="span"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '1.1rem', sm: '1.2rem' },
                fontWeight: 500,
              }}
            >
              &gt;
            </Typography>
            <Button
              variant="text"
              endIcon={<ArrowDropDownIcon />}
              onClick={handleMonthPickerOpen}
              sx={{
                minWidth: 0,
                px: 0.25,
                color: 'text.primary',
                fontSize: { xs: '1.3rem', sm: '1.55rem' },
                fontWeight: 600,
                letterSpacing: '-0.02em',
                textTransform: 'none',
              }}
            >
              {format(monthDate, 'MMMM')}
            </Button>
          </Stack>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onMonthChange(format(new Date(), 'yyyy-MM'))}
            sx={{
              minWidth: 0,
              px: 1.5,
              borderRadius: 999,
              textTransform: 'none',
            }}
          >
            Today
          </Button>
        </Stack>

        <Stack direction="row" spacing={0.5} sx={{ alignSelf: { xs: 'flex-end', sm: 'auto' } }}>
          <IconButton
            aria-label="Previous month"
            onClick={() => onMonthChange(format(addMonths(monthDate, -1), 'yyyy-MM'))}
            size="small"
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            aria-label="Next month"
            onClick={() => onMonthChange(format(addMonths(monthDate, 1), 'yyyy-MM'))}
            size="small"
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Menu
        anchorEl={monthAnchorEl}
        open={Boolean(monthAnchorEl)}
        onClose={() => setMonthAnchorEl(null)}
      >
        {isLoadingPeriodSummaries ? (
          <MenuItem disabled>Loading months...</MenuItem>
        ) : (
          monthSummaryOptions.map((month) => (
            <MenuItem
              key={month.monthIndex}
              selected={month.monthIndex === monthDate.getMonth()}
              onClick={() => handleMonthSelect(month.monthIndex)}
              sx={{ minWidth: 260 }}
            >
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                sx={{ width: '100%' }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {month.label}
                </Typography>
                <SummaryBreakdown
                  totalIncomeMinor={month.totalIncomeMinor}
                  totalExpenseMinor={month.totalExpenseMinor}
                  currency={currency}
                />
              </Stack>
            </MenuItem>
          ))
        )}
      </Menu>

      <Menu
        anchorEl={yearAnchorEl}
        open={Boolean(yearAnchorEl)}
        onClose={() => setYearAnchorEl(null)}
      >
        {isLoadingPeriodSummaries ? (
          <MenuItem disabled>Loading years...</MenuItem>
        ) : (
          yearSummaryOptions.map((year) => (
            <MenuItem
              key={year.year}
              selected={year.year === monthDate.getFullYear()}
              onClick={() => handleYearSelect(year.year)}
              sx={{ minWidth: 260 }}
            >
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                sx={{ width: '100%' }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {year.year}
                </Typography>
                <SummaryBreakdown
                  totalIncomeMinor={year.totalIncomeMinor}
                  totalExpenseMinor={year.totalExpenseMinor}
                  currency={currency}
                />
              </Stack>
            </MenuItem>
          ))
        )}
      </Menu>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          px: { xs: 1, sm: 2 },
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {WEEKDAY_LABELS.map((label) => (
          <Typography
            key={label}
            variant="caption"
            color="text.secondary"
            sx={{
              px: 1,
              py: 0.5,
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gridAutoRows: { xs: 'minmax(84px, 1fr)', sm: 'minmax(72px, 1fr)' },
        }}
      >
        {calendarDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const inVisibleMonth = isSameMonth(day, monthDate)
          const isCurrentDay = isToday(day)
          const isPendingStart = pendingRangeStart === dateKey
          const isInRange =
            !pendingRangeStart &&
            dateKey >= selectedRange.from &&
            dateKey <= selectedRange.to
          const isRangeBoundary =
            isInRange &&
            (dateKey === selectedRange.from || dateKey === selectedRange.to)
          const totals = dayMap.get(dateKey)
          const isLastColumn = index % 7 === 6
          const rangeHighlightColor = alpha(theme.palette.primary.main, 0.24)
          const rangeBoundaryHighlightColor = alpha(theme.palette.primary.main, 0.38)
          const dayBackground = !inVisibleMonth
            ? alpha(theme.palette.action.hover, theme.palette.mode === 'dark' ? 0.16 : 0.38)
            : isPendingStart
              ? alpha(theme.palette.error.main, 0.12)
              : isRangeBoundary
              ? rangeBoundaryHighlightColor
              : isInRange
                ? rangeHighlightColor
                : 'transparent'

          return (
            <Box
              key={dateKey}
              onClick={() => {
                if (inVisibleMonth) {
                  onDateSelect(dateKey)
                }
              }}
              sx={{
                minHeight: { xs: 84, sm: 72 },
                borderRight: isLastColumn ? 'none' : '1px solid',
                borderBottom: '1px solid',
                borderColor:
                  isInRange && inVisibleMonth
                    ? alpha(theme.palette.primary.main, 0.35)
                    : alpha(theme.palette.divider, 0.85),
                backgroundColor: dayBackground,
                boxShadow:
                  isRangeBoundary && inVisibleMonth
                    ? `inset 0 0 0 1px ${alpha(theme.palette.primary.dark, 0.28)}`
                    : isInRange && inVisibleMonth
                      ? `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.18)}`
                      : 'none',
                px: 0.75,
                py: 0.5,
                cursor: inVisibleMonth ? 'pointer' : 'default',
                opacity: inVisibleMonth ? 1 : 0.62,
                transition: 'background-color 160ms ease, border-color 160ms ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.45,
                position: 'relative',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  width: 28,
                  height: 28,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  fontWeight: isRangeBoundary || isCurrentDay || isPendingStart ? 700 : 600,
                  color:
                    isCurrentDay || isRangeBoundary || isPendingStart
                      ? theme.palette.primary.contrastText
                      : inVisibleMonth
                        ? 'text.primary'
                        : 'text.secondary',
                  backgroundColor:
                    isPendingStart
                      ? 'error.main'
                      : isCurrentDay || isRangeBoundary
                        ? 'primary.main'
                      : 'transparent',
                }}
              >
                {format(day, 'd')}
              </Typography>

              {isLoading ? (
                <>
                  <Skeleton variant="rounded" height={20} />
                  <Skeleton variant="rounded" height={20} />
                </>
              ) : (
                <Stack spacing={0.4} sx={{ minWidth: 0 }}>
                  {totals && totals.totalIncome.amountMinor > 0 && (
                    <Box
                      onClick={(event) => {
                        event.stopPropagation()
                        onEventClick(dateKey, 'income')
                      }}
                      title={eventLabel(totals.totalIncome.amountMinor, currency)}
                      sx={{
                        borderRadius: 1,
                        px: 0.5,
                        py: 0.2,
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? alpha(theme.palette.success.main, 0.22)
                            : alpha(theme.palette.success.main, 0.14),
                        color: theme.palette.success.main,
                        fontSize: 10,
                        fontWeight: 600,
                        lineHeight: 1.25,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        borderLeft: '3px solid',
                        borderLeftColor: 'success.main',
                      }}
                    >
                      {eventLabel(totals.totalIncome.amountMinor, currency)}
                    </Box>
                  )}

                  {totals && totals.totalExpense.amountMinor > 0 && (
                    <Box
                      onClick={(event) => {
                        event.stopPropagation()
                        onEventClick(dateKey, 'expense')
                      }}
                      title={eventLabel(totals.totalExpense.amountMinor, currency)}
                      sx={{
                        borderRadius: 1,
                        px: 0.5,
                        py: 0.2,
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? alpha(theme.palette.error.main, 0.22)
                            : alpha(theme.palette.error.main, 0.14),
                        color: theme.palette.error.main,
                        fontSize: 10,
                        fontWeight: 600,
                        lineHeight: 1.25,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        borderLeft: '3px solid',
                        borderLeftColor: 'error.main',
                      }}
                    >
                      {eventLabel(totals.totalExpense.amountMinor, currency)}
                    </Box>
                  )}
                </Stack>
              )}
            </Box>
          )
        })}
      </Box>

      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
          >
            <FormControl
              size="small"
              sx={{ minWidth: 160 }}
              disabled={isLoadingCurrencies || currencyOptions.length === 0}
            >
              <InputLabel>Currency</InputLabel>
              <Select
                value={currency}
                label="Currency"
                onChange={(event) => onCurrencyChange(String(event.target.value))}
              >
                {currencyOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={includeConverted}
                  onChange={(event) => onIncludeConvertedChange(event.target.checked)}
                  disabled={!currency}
                />
              }
              label="Include other currencies"
            />
          </Stack>

          {selectionStatusText && (
            <Typography variant="body2" color="text.secondary">
              {selectionStatusText}
            </Typography>
          )}

          {selectionSecondaryText && (
            <Typography variant="caption" color="text.secondary">
              {selectionSecondaryText}
            </Typography>
          )}
        </Stack>
      </Box>
    </Paper>
  )
}
