'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import type { Currency } from '@/types'
import { useCurrency } from '@/contexts/CurrencyContext'

interface EditCurrencyModalProps {
  open: boolean
  currency: Currency | null
  onClose: () => void
  onSaved?: (newCode: string) => void
  onError?: (message: string) => void
}

export function EditCurrencyModal({
  open,
  currency,
  onClose,
  onSaved,
  onError,
}: EditCurrencyModalProps) {
  const { updateCurrency } = useCurrency()

  const [code, setCode] = useState<string>(currency?.code ?? '')
  const [inputError, setInputError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const originalCode = currency?.code ?? ''
  const normalizedCode = useMemo(() => code.trim().toUpperCase(), [code])
  const hasChanged = useMemo(() => normalizedCode !== originalCode, [normalizedCode, originalCode])

  useEffect(() => {
    if (open && currency) {
      setCode(currency.code)
      setInputError(null)
    }
  }, [open, currency?.code])

  const validate = (): boolean => {
    if (!normalizedCode) {
      setInputError('Currency code cannot be empty')
      return false
    }
    if (!/^[A-Z]{3}$/.test(normalizedCode)) {
      setInputError('Currency code must be exactly 3 uppercase letters (ISO 4217)')
      return false
    }
    setInputError(null)
    return true
  }

  const performSave = async () => {
    if (!currency) return
    if (!hasChanged) {
      onClose()
      return
    }
    try {
      setIsSaving(true)
      await updateCurrency(currency.code, { code: normalizedCode })
      onSaved?.(normalizedCode)
      onClose()
    } catch (error: any) {
      const message = error?.message || 'Failed to update currency'
      setInputError(message)
      onError?.(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = () => {
    if (!validate()) return
    performSave()
  }

  return (
    <Dialog open={open} onClose={() => !isSaving && onClose()}>
      <DialogTitle>Edit Currency</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Current code: <strong>{originalCode}</strong>
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label="Currency Code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          inputProps={{ maxLength: 3 }}
          disabled={isSaving}
          error={Boolean(inputError)}
          helperText={inputError || 'Enter a 3-letter code, e.g., USD'}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSave()
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={isSaving || !hasChanged}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}


