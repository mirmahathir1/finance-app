'use client'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
} from 'recharts'
import { Paper, Typography } from '@mui/material'

export interface ExpensePieItem {
  name: string
  value: number // display units (e.g., 123.45), not minor
  color?: string
}

interface ExpenseBreakdownPieProps {
  title?: string
  items: ExpensePieItem[]
  height?: number
}

const DEFAULT_COLORS = ['#e53935', '#d32f2f', '#ef5350', '#f44336', '#ff7043', '#ff8a65']

export function ExpenseBreakdownPie({
  title = 'Expense Breakdown',
  items,
  height = 360,
}: ExpenseBreakdownPieProps) {
  const data = items.map((item, idx) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
  }))

  return (
    <Paper elevation={2} sx={{ p: 2, height, minWidth: 0 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={110}
            label
            isAnimationActive
            animationDuration={400}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color!} />
            ))}
          </Pie>
          <ReTooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  )
}


