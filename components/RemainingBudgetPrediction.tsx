'use client'

import { useState, useEffect, useRef } from 'react'
import { Box, Slider, Typography } from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'

const DEFAULT_BUDGET_PERCENTAGE = 100

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
  const { user, updateBudgetPercentage } = useAuth()
  const [percentage, setPercentage] = useState(DEFAULT_BUDGET_PERCENTAGE)
  // Last value known to be persisted, used to restore the slider if a save fails.
  const savedPercentage = useRef(DEFAULT_BUDGET_PERCENTAGE)

  useEffect(() => {
    const stored = user?.budgetPercentage
    const next =
      typeof stored === 'number' && !Number.isNaN(stored)
        ? Math.min(100, Math.max(0, Math.round(stored)))
        : DEFAULT_BUDGET_PERCENTAGE
    setPercentage(next)
    savedPercentage.current = next
  }, [user?.id, user?.budgetPercentage])

  const persistPercentage = async (value: number) => {
    if (value === savedPercentage.current) {
      return
    }

    try {
      await updateBudgetPercentage(value)
      savedPercentage.current = value
    } catch {
      // Restore the last persisted value so the slider never shows an
      // unsaved budget.
      setPercentage(savedPercentage.current)
    }
  }

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
          onChangeCommitted={(_, value) => {
            void persistPercentage(value as number)
          }}
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
