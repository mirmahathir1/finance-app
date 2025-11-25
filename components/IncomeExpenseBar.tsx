'use client'

import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Legend,
  Bar,
} from 'recharts'
import { Box, Paper, Typography } from '@mui/material'
import { useMemo } from 'react'

interface IncomeExpenseBarProps {
  title?: string
  income: number // display units (e.g., 123.45), not minor
  expense: number // display units (e.g., 123.45), not minor
  height?: number
  currency?: string
}

export function IncomeExpenseBar({
  title = 'Income vs Expense',
  income,
  expense,
  height = 360,
  currency,
}: IncomeExpenseBarProps) {
  const chartHeight = Math.max(height - 56, 240)

  const data = useMemo(
    () => [
      {
        name: 'Totals',
        Income: income,
        Expense: expense,
      },
    ],
    [income, expense]
  )

  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
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
      <Typography variant="subtitle1" sx={{ mb: 1, flexShrink: 0 }}>
        {title}
      </Typography>
      <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%', minHeight: chartHeight }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={data} margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis 
              tickFormatter={formatCurrency}
              width={80}
              tick={{ fontSize: 12 }}
            />
            <ReTooltip formatter={(value: any) => formatCurrency(value as number)} />
            <Legend />
            <Bar dataKey="Income" fill="#2e7d32" isAnimationActive animationDuration={400} />
            <Bar dataKey="Expense" fill="#c62828" isAnimationActive animationDuration={400} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  )
}


