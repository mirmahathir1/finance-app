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
  days: StatisticsCalendarDay[]
  selectedRange: { from: string; to: string }
  pendingRangeStart?: string | null
  selectionStatusText?: string
  selectionSecondaryText?: string
  isLoading?: boolean
  isLoadingCurrencies?: boolean
  onMonthChange: (month: string) => void
  onDateSelect: (date: string) => void
  onEventClick: (date: string, type: TransactionType) => void
  onCurrencyChange: (currency: string) => void
  onIncludeConvertedChange: (checked: boolean) => void
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: index,
  label: format(new Date(2026, index, 1), 'MMMM'),
}))

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

export function StatisticsCalendar({
  visibleMonth,
  currency,
  currencyOptions,
  includeConverted,
  days,
  selectedRange,
  pendingRangeStart,
  selectionStatusText,
  selectionSecondaryText,
  isLoading = false,
  isLoadingCurrencies = false,
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
  const yearOptions = useMemo(() => {
    const visibleYear = monthDate.getFullYear()
    return Array.from({ length: 17 }, (_, index) => visibleYear - 8 + index)
  }, [monthDate])

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
        width: { xs: '100%', md: '50%' },
        mx: { xs: 0, md: 'auto' },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Button
              variant="text"
              endIcon={<ArrowDropDownIcon />}
              onClick={handleMonthPickerOpen}
              sx={{
                minWidth: 0,
                px: 0.5,
                color: 'text.primary',
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                fontWeight: 500,
                letterSpacing: '-0.01em',
                textTransform: 'none',
              }}
            >
              {format(monthDate, 'MMMM')}
            </Button>
            <Button
              variant="text"
              endIcon={<ArrowDropDownIcon />}
              onClick={handleYearPickerOpen}
              sx={{
                minWidth: 0,
                px: 0.5,
                color: 'text.primary',
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                fontWeight: 500,
                letterSpacing: '-0.01em',
                textTransform: 'none',
              }}
            >
              {format(monthDate, 'yyyy')}
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

        <Stack direction="row" spacing={0.5}>
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
        {MONTH_OPTIONS.map((month) => (
          <MenuItem
            key={month.value}
            selected={month.value === monthDate.getMonth()}
            onClick={() => handleMonthSelect(month.value)}
          >
            {month.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={yearAnchorEl}
        open={Boolean(yearAnchorEl)}
        onClose={() => setYearAnchorEl(null)}
      >
        {yearOptions.map((year) => (
          <MenuItem
            key={year}
            selected={year === monthDate.getFullYear()}
            onClick={() => handleYearSelect(year)}
          >
            {year}
          </MenuItem>
        ))}
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
          const dayBackground = !inVisibleMonth
            ? alpha(theme.palette.action.hover, theme.palette.mode === 'dark' ? 0.16 : 0.38)
            : isPendingStart
              ? alpha(theme.palette.error.main, 0.12)
              : isRangeBoundary
              ? alpha(theme.palette.primary.main, 0.2)
              : isInRange
                ? alpha(theme.palette.primary.main, 0.08)
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
                borderColor: alpha(theme.palette.divider, 0.85),
                backgroundColor: dayBackground,
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
