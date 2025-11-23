'use client'

import { useEffect } from 'react'
import { TextField } from '@mui/material'
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { format, parse, parseISO } from 'date-fns'

interface DatePickerProps {
  label: string
  value: string // YYYY-MM-DD format
  onChange: (value: string) => void
  error?: boolean
  helperText?: string
  disabled?: boolean
  required?: boolean
}

export function DatePicker({
  label,
  value,
  onChange,
  error,
  helperText,
  disabled,
  required,
}: DatePickerProps) {
  // Parse YYYY-MM-DD string to Date object, default to today if empty
  const today = new Date()
  const todayFormatted = format(today, 'yyyy-MM-dd')
  
  // Try to parse the value, handling both YYYY-MM-DD and ISO formats
  let dateValue: Date = today
  if (value && value.trim()) {
    try {
      // If it looks like an ISO string (contains 'T'), use parseISO
      if (value.includes('T')) {
        const isoDate = parseISO(value)
        if (!isNaN(isoDate.getTime())) {
          dateValue = isoDate
        }
      } else {
        // Try parsing as YYYY-MM-DD
        const parsed = parse(value, 'yyyy-MM-dd', new Date())
        if (!isNaN(parsed.getTime())) {
          dateValue = parsed
        }
      }
    } catch (e) {
      // If parsing fails, use today (already set as default)
    }
  }

  // Initialize parent state with today's date if value is empty on mount
  useEffect(() => {
    if (!value || value.trim() === '') {
      const todayDate = format(new Date(), 'yyyy-MM-dd')
      onChange(todayDate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount to initialize empty values

  const handleChange = (newValue: Date | null) => {
    if (newValue) {
      // Format Date object to YYYY-MM-DD string
      const formatted = format(newValue, 'yyyy-MM-dd')
      onChange(formatted)
    } else {
      // Default to today's date if null
      onChange(todayFormatted)
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <MuiDatePicker
        label={label}
        value={dateValue}
        onChange={handleChange}
        disabled={disabled}
        slotProps={{
          textField: {
            error,
            helperText,
            required,
            fullWidth: true,
          },
        }}
      />
    </LocalizationProvider>
  )
}

