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
import { Paper, Typography } from '@mui/material'

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
  const data = [
    {
      name: 'Totals',
      Income: income,
      Expense: expense,
    },
  ]

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
    <Paper elevation={2} sx={{ p: 2, height, minWidth: 0 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={formatCurrency} />
          <ReTooltip formatter={(value: any) => formatCurrency(value as number)} />
          <Legend />
          <Bar dataKey="Income" fill="#43a047" isAnimationActive animationDuration={400} />
          <Bar dataKey="Expense" fill="#e53935" isAnimationActive animationDuration={400} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  )
}


