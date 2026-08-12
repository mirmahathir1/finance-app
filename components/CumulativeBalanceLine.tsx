'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ReferenceLine,
  Line,
} from 'recharts'
import { Box, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { format, parseISO } from 'date-fns'
import { DatePicker } from '@/components/DatePicker'

interface CumulativeBalanceLineProps {
  data: { date: string; balance: number }[] // date = YYYY-MM-DD, balance in major units
  currency: string
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  isLoading?: boolean
  height?: number
}

export function CumulativeBalanceLine({
  data,
  currency,
  from,
  to,
  onFromChange,
  onToChange,
  isLoading = false,
  height = 380,
}: CumulativeBalanceLineProps) {
  const chartHeight = Math.max(height - 140, 220)

  const points = useMemo(
    () =>
      data.map((point) => ({
        ...point,
        timestamp: parseISO(point.date).getTime(),
      })),
    [data]
  )

  const spansMultipleYears = useMemo(() => {
    if (points.length === 0) return false
    return data[0].date.slice(0, 4) !== data[data.length - 1].date.slice(0, 4)
  }, [data, points.length])

  const formatCurrency = (value: number, maximumFractionDigits?: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        ...(maximumFractionDigits === undefined ? {} : { maximumFractionDigits }),
      }).format(value)
    } catch {
      return value.toLocaleString()
    }
  }

  const formatTick = (value: number) => {
    try {
      return format(new Date(value), spansMultipleYears ? 'MMM d, yy' : 'MMM d')
    } catch {
      return ''
    }
  }

  const header = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ mb: 2, flexShrink: 0 }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
    >
      <Typography variant="subtitle1">Cumulative Balance</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { sm: 360 } }}>
        <DatePicker label="From" value={from} onChange={onFromChange} />
        <DatePicker label="To" value={to} onChange={onToChange} />
      </Stack>
    </Stack>
  )

  return (
    <Paper
      elevation={2}
      sx={{ p: 2, minHeight: height, minWidth: 0, display: 'flex', flexDirection: 'column' }}
    >
      {header}
      <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%', minHeight: chartHeight }}>
        {isLoading ? (
          <Skeleton variant="rectangular" height={chartHeight} sx={{ borderRadius: 1 }} />
        ) : points.length === 0 ? (
          <Box
            sx={{
              height: chartHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No transaction history available for this currency.
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={points} margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatTick}
                interval="preserveStartEnd"
                minTickGap={32}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value: number) => formatCurrency(value, 0)}
                width={80}
                tick={{ fontSize: 12 }}
              />
              <ReTooltip
                labelFormatter={(value) => {
                  try {
                    return format(new Date(value as number), 'MMM d, yyyy')
                  } catch {
                    return ''
                  }
                }}
                formatter={(value: any) => [formatCurrency(value as number), 'Balance']}
              />
              <ReferenceLine y={0} stroke="#9e9e9e" strokeDasharray="4 4" />
              <Line
                type="stepAfter"
                dataKey="balance"
                stroke="#1976d2"
                strokeWidth={2}
                dot={points.length === 1}
                isAnimationActive
                animationDuration={400}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, flexShrink: 0 }}>
        Running balance carried in from all earlier transactions. Tag filters are not applied.
      </Typography>
    </Paper>
  )
}
