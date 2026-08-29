'use client'

import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Legend,
  Line,
} from 'recharts'
import {
  Box,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { addMonths, format, parseISO, startOfMonth } from 'date-fns'
import type { Transaction, TransactionType } from '@/types'

interface TagTrendLineProps {
  transactions: Transaction[]
  currency: string
  from: string // YYYY-MM-DD
  to: string // YYYY-MM-DD
  title?: string
  height?: number
}

const UNTAGGED_KEY = 'Untagged'
const OTHER_KEY = 'Other'
const MAX_TAG_LINES = 8

const LINE_COLORS = [
  '#1976d2',
  '#c62828',
  '#2e7d32',
  '#ed6c02',
  '#7b1fa2',
  '#0097a7',
  '#c2185b',
  '#5d4037',
  '#455a64',
  '#9e9d24',
]

function getDisplayAmountMinor(transaction: Transaction) {
  return transaction.displayAmountMinor ?? transaction.amountMinor
}

// Every month between the two endpoints, inclusive, so months without any
// activity are drawn as zero instead of being skipped.
function getMonthsInRange(from: string, to: string) {
  const months: string[] = []
  const last = format(startOfMonth(parseISO(to)), 'yyyy-MM')
  let cursor = startOfMonth(parseISO(from))

  for (let i = 0; i < 600; i += 1) {
    const month = format(cursor, 'yyyy-MM')
    months.push(month)
    if (month >= last) break
    cursor = addMonths(cursor, 1)
  }

  return months
}

export function TagTrendLine({
  transactions,
  currency,
  from,
  to,
  title = 'Monthly Totals By Tag',
  height = 420,
}: TagTrendLineProps) {
  const [type, setType] = useState<TransactionType>('expense')
  const chartHeight = Math.max(height - 130, 240)

  const { data, lineKeys, hasData } = useMemo(() => {
    const months = getMonthsInRange(from, to)
    const monthIndex = new Map(months.map((month, index) => [month, index]))
    // tag -> month -> minor units
    const totalsByTag = new Map<string, number[]>()

    for (const transaction of transactions) {
      if (transaction.type !== type) continue

      const index = monthIndex.get(transaction.occurredAt.slice(0, 7))
      if (index === undefined) continue

      const amountMinor = getDisplayAmountMinor(transaction)
      const keys = transaction.tags.length > 0 ? transaction.tags : [UNTAGGED_KEY]

      for (const key of keys) {
        const series = totalsByTag.get(key) || new Array(months.length).fill(0)
        series[index] += amountMinor
        totalsByTag.set(key, series)
      }
    }

    const ranked = Array.from(totalsByTag.entries())
      .map(([tag, series]) => ({
        tag,
        series,
        total: series.reduce((sum, value) => sum + value, 0),
      }))
      .sort((left, right) => right.total - left.total)

    const visible = ranked.slice(0, MAX_TAG_LINES)
    const remainder = ranked.slice(MAX_TAG_LINES)

    if (remainder.length > 0) {
      visible.push({
        tag: OTHER_KEY,
        series: months.map((_, index) =>
          remainder.reduce((sum, entry) => sum + entry.series[index], 0)
        ),
        total: remainder.reduce((sum, entry) => sum + entry.total, 0),
      })
    }

    const rows = months.map((month, index) => {
      const row: Record<string, string | number> = {
        month,
        label: format(parseISO(`${month}-01`), 'MMM yyyy'),
      }

      for (const entry of visible) {
        row[entry.tag] = entry.series[index] / 100
      }

      return row
    })

    return {
      data: rows,
      lineKeys: visible.map((entry) => entry.tag),
      hasData: ranked.length > 0,
    }
  }, [from, to, transactions, type])

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

  return (
    <Paper
      elevation={2}
      sx={{ p: 2, height, minWidth: 0, display: 'flex', flexDirection: 'column' }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 1, flexShrink: 0 }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
      >
        <Typography variant="subtitle1">{title}</Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={type}
          onChange={(_event, value) => {
            if (value) setType(value as TransactionType)
          }}
          aria-label="Transaction type"
        >
          <ToggleButton value="expense" color="error">
            Expense
          </ToggleButton>
          <ToggleButton value="income" color="success">
            Income
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%', minHeight: chartHeight }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={data} margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={16} />
              <YAxis
                tickFormatter={(value: number) => formatCurrency(value, 0)}
                width={80}
                tick={{ fontSize: 12 }}
              />
              <ReTooltip
                formatter={(value: any, name: any) => [formatCurrency(value as number), name]}
              />
              <Legend />
              {lineKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={LINE_COLORS[index % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive
                  animationDuration={400}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Box
            sx={{
              height: chartHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No {type} transactions in the selected range.
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  )
}
