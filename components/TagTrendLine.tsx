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
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Select,
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
const DEFAULT_TAG_LINES = 5

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
  // Kept per type because expense and income have different tag sets; `null`
  // means "untouched", so the default top tags apply.
  const [selectionByType, setSelectionByType] = useState<
    Record<TransactionType, string[] | null>
  >({ expense: null, income: null })
  const chartHeight = Math.max(height - 190, 240)

  const { data, availableTags, colorByTag } = useMemo(() => {
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

    const rows = months.map((month, index) => {
      const row: Record<string, string | number> = {
        month,
        label: format(parseISO(`${month}-01`), 'MMM yyyy'),
      }

      for (const entry of ranked) {
        row[entry.tag] = entry.series[index] / 100
      }

      return row
    })

    // Colour comes from the overall ranking so a tag keeps its line colour no
    // matter which other tags are selected.
    const colors = new Map<string, string>(
      ranked.map((entry, index) => [entry.tag, LINE_COLORS[index % LINE_COLORS.length]])
    )

    return {
      data: rows,
      availableTags: ranked.map((entry) => entry.tag),
      colorByTag: colors,
    }
  }, [from, to, transactions, type])

  const selectedTags = useMemo(() => {
    const stored = selectionByType[type]
    if (stored === null) {
      return availableTags.slice(0, DEFAULT_TAG_LINES)
    }
    const available = new Set(availableTags)
    return stored.filter((tag) => available.has(tag))
  }, [availableTags, selectionByType, type])

  const hasData = availableTags.length > 0

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

      <FormControl size="small" fullWidth sx={{ mb: 1.5, flexShrink: 0 }} disabled={!hasData}>
        <InputLabel id="tag-trend-tags-label">Tags</InputLabel>
        <Select
          multiple
          labelId="tag-trend-tags-label"
          id="tag-trend-tags"
          label="Tags"
          value={selectedTags}
          onChange={(event) => {
            const value = event.target.value
            const next = typeof value === 'string' ? value.split(',') : value
            setSelectionByType((current) => ({ ...current, [type]: next }))
          }}
          renderValue={(selected) =>
            selected.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No tags selected
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{
                      backgroundColor: colorByTag.get(tag),
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Box>
            )
          }
          MenuProps={{ PaperProps: { style: { maxHeight: 320 } } }}
        >
          {availableTags.map((tag) => (
            <MenuItem key={tag} value={tag} dense>
              <Checkbox size="small" checked={selectedTags.includes(tag)} />
              <ListItemText
                primary={tag}
                primaryTypographyProps={{ variant: 'body2' }}
              />
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  ml: 1,
                  backgroundColor: colorByTag.get(tag),
                }}
              />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%', minHeight: chartHeight }}>
        {hasData && selectedTags.length > 0 ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={data} margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={16} />
              <YAxis
                domain={[0, 'auto']}
                tickFormatter={(value: number) => formatCurrency(value, 0)}
                width={80}
                tick={{ fontSize: 12 }}
              />
              <ReTooltip
                formatter={(value: any, name: any) => [formatCurrency(value as number), name]}
              />
              <Legend />
              {selectedTags.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colorByTag.get(key)}
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
              {hasData
                ? 'Select at least one tag to show.'
                : `No ${type} transactions in the selected range.`}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  )
}
