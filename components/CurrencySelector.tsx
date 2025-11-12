'use client'

import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
} from '@mui/material'
import { useState } from 'react'
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
  const { currencies, defaultCurrency, addCurrency, isLoading } = useCurrency()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newCurrencyCode, setNewCurrencyCode] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const handleChange = (event: SelectChangeEvent<string>) => {
    const newValue = event.target.value
    if (newValue === '__add_new__') {
      setAddDialogOpen(true)
    } else {
      onChange(newValue)
    }
  }

  const handleAddCurrency = async () => {
    if (!newCurrencyCode.trim()) {
      setAddError('Currency code is required')
      return
    }

    // Validate format (3 uppercase letters)
    const normalized = newCurrencyCode.trim().toUpperCase()
    if (!/^[A-Z]{3}$/.test(normalized)) {
      setAddError('Currency code must be exactly 3 uppercase letters (ISO 4217 format)')
      return
    }

    setIsAdding(true)
    setAddError(null)

    try {
      await addCurrency(normalized, false)
      setAddDialogOpen(false)
      setNewCurrencyCode('')
      onChange(normalized) // Select the newly added currency
    } catch (err: any) {
      setAddError(err.message || 'Failed to add currency')
    } finally {
      setIsAdding(false)
    }
  }

  const handleCloseDialog = () => {
    setAddDialogOpen(false)
    setNewCurrencyCode('')
    setAddError(null)
  }

  return (
    <>
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
          <MenuItem value="__add_new__">
            <em>+ Add New Currency</em>
          </MenuItem>
        </Select>
        {helperText && (
          <Box sx={{ mt: 0.5, fontSize: '0.75rem', color: error ? 'error.main' : 'text.secondary' }}>
            {helperText}
          </Box>
        )}
      </FormControl>

      <Dialog open={addDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Currency</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Currency Code"
            placeholder="USD"
            fullWidth
            value={newCurrencyCode}
            onChange={(e) => {
              setNewCurrencyCode(e.target.value.toUpperCase())
              setAddError(null)
            }}
            error={!!addError}
            helperText={addError || 'Enter 3-letter ISO 4217 currency code (e.g., USD, EUR, GBP)'}
            inputProps={{
              maxLength: 3,
              style: { textTransform: 'uppercase' },
            }}
            sx={{ mt: 2 }}
          />
          {addError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {addError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isAdding}>
            Cancel
          </Button>
          <Button onClick={handleAddCurrency} variant="contained" disabled={isAdding}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

