'use client'

import { useState, useEffect } from 'react'
import { Box, Slider, Typography } from '@mui/material'

const BUDGET_PERCENTAGE_STORAGE_KEY = 'finance-app-budget-percentage'

interface RemainingBudgetPredictionProps {
  previousIncomeMinor: number
  currentExpenseMinor: number
  currency: string
  formatAmount: (amountMinor: number, currency: string) => string
}

export function RemainingBudgetPrediction({
  previousIncomeMinor,
  currentExpenseMinor,
  currency,
  formatAmount,
}: RemainingBudgetPredictionProps) {
  const [percentage, setPercentage] = useState(100)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(BUDGET_PERCENTAGE_STORAGE_KEY)
    if (saved !== null) {
      const parsed = parseInt(saved, 10)
      if (!Number.isNaN(parsed)) {
        setPercentage(Math.min(100, Math.max(0, parsed)))
      }
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(BUDGET_PERCENTAGE_STORAGE_KEY, String(percentage))
    }
  }, [percentage, mounted])

  const remainingMinor =
    Math.round((previousIncomeMinor * percentage) / 100) - currentExpenseMinor

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle2" gutterBottom>
        Remaining Budget Prediction
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          gap: 3,
        }}
      >
        <Slider
          value={percentage}
          onChange={(_, value) => setPercentage(value as number)}
          min={0}
          max={100}
          step={5}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value}%`}
          sx={{ flex: 1 }}
        />
        <Typography
          variant="h5"
          sx={{
            color: remainingMinor < 0 ? 'error.main' : 'success.main',
            minWidth: 140,
            textAlign: { xs: 'center', sm: 'right' },
          }}
        >
          {formatAmount(remainingMinor, currency)}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Budget: {percentage}% of last month&apos;s income (
        {formatAmount(previousIncomeMinor, currency)}) minus this month&apos;s
        expenses
      </Typography>
    </Box>
  )
}
