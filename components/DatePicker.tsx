'use client'

import { TextField } from '@mui/material'
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { format, parse } from 'date-fns'

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
  // Parse YYYY-MM-DD string to Date object
  const dateValue = value ? parse(value, 'yyyy-MM-dd', new Date()) : null

  const handleChange = (newValue: Date | null) => {
    if (newValue) {
      // Format Date object to YYYY-MM-DD string
      const formatted = format(newValue, 'yyyy-MM-dd')
      onChange(formatted)
    } else {
      onChange('')
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

