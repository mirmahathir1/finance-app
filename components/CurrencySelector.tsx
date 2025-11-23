'use client'

import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
} from '@mui/material'
import { useCurrency } from '@/contexts/CurrencyContext'

interface CurrencySelectorProps {
  value: string
  onChange: (currency: string) => void
  label?: string
  required?: boolean
  error?: boolean
  helperText?: string
  disabled?: boolean
  fullWidth?: boolean
}

export function CurrencySelector({
  value,
  onChange,
  label = 'Currency',
  required,
  error,
  helperText,
  disabled,
  fullWidth = true,
}: CurrencySelectorProps) {
  const { currencies, isLoading } = useCurrency()

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value)
  }

  return (
    <FormControl fullWidth={fullWidth} required={required} error={error} disabled={disabled || isLoading}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ''}
        onChange={handleChange}
        label={label}
      >
        {currencies.map((currency) => (
          <MenuItem key={currency.code} value={currency.code}>
            {currency.code}
            {currency.isDefault && ' (Default)'}
          </MenuItem>
        ))}
      </Select>
      {helperText && (
        <Box sx={{ mt: 0.5, fontSize: '0.75rem', color: error ? 'error.main' : 'text.secondary' }}>
          {helperText}
        </Box>
      )}
    </FormControl>
  )
}

