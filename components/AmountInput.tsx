'use client'

import { TextField, InputAdornment } from '@mui/material'
import { useState, useEffect } from 'react'

interface AmountInputProps {
  label: string
  value: number // Amount in minor units (e.g., 10000 = $100.00)
  onChange: (value: number) => void
  currency?: string
  error?: boolean
  helperText?: string
  disabled?: boolean
  required?: boolean
  fullWidth?: boolean
}

/**
 * AmountInput component
 * Handles amount input with proper formatting
 * Value is stored in minor units (integer), but displayed as decimal
 */
export function AmountInput({
  label,
  value,
  onChange,
  currency = 'USD',
  error,
  helperText,
  disabled,
  required,
  fullWidth = true,
}: AmountInputProps) {
  // Convert minor units to decimal for display
  const minorToDecimal = (minor: number): string => {
    if (minor === 0) return ''
    return (minor / 100).toFixed(2)
  }

  // Convert decimal string to minor units
  const decimalToMinor = (decimal: string): number => {
    const cleaned = decimal.replace(/[^0-9.]/g, '')
    if (!cleaned || cleaned === '.') return 0
    const num = parseFloat(cleaned)
    if (isNaN(num)) return 0
    return Math.round(num * 100)
  }

  const [displayValue, setDisplayValue] = useState<string>(minorToDecimal(value))

  // Update display value when prop value changes
  useEffect(() => {
    setDisplayValue(minorToDecimal(value))
  }, [value])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value
    setDisplayValue(inputValue)
    
    // Convert to minor units and call onChange
    const minor = decimalToMinor(inputValue)
    onChange(minor)
  }

  const handleBlur = () => {
    // Format on blur
    const minor = decimalToMinor(displayValue)
    setDisplayValue(minorToDecimal(minor))
  }

  return (
    <TextField
      label={label}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      error={error}
      helperText={helperText}
      disabled={disabled}
      required={required}
      fullWidth={fullWidth}
      type="text"
      inputMode="decimal"
      InputProps={{
        startAdornment: currency && (
          <InputAdornment position="start">{currency}</InputAdornment>
        ),
      }}
    />
  )
}

