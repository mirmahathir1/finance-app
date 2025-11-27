'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Chip,
  Typography,
  CircularProgress,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Save as SaveIcon,
} from '@mui/icons-material'
import { DatePicker } from '@/components/DatePicker'
import { AmountInput } from '@/components/AmountInput'
import { CurrencySelector } from '@/components/CurrencySelector'
import { useTag } from '@/contexts/TagContext'
import { useApi } from '@/utils/useApi'
import type { Transaction, TransactionType } from '@/types'
import { standardDialogPaperSx } from './dialogSizing'
import { format, parseISO } from 'date-fns'

interface EditTransactionModalProps {
  open: boolean
  transaction: Transaction | null
  onClose: () => void
  onSuccess: () => void
}

export function EditTransactionModal({
  open,
  transaction,
  onClose,
  onSuccess,
}: EditTransactionModalProps) {
  const { tags } = useTag()
  const api = useApi()

  // Form state
  const [type, setType] = useState<TransactionType>('expense')
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [amount, setAmount] = useState<number>(0)
  const [currency, setCurrency] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [errors, setErrors] = useState<{
    date?: string
    amount?: string
    currency?: string
    description?: string
    tags?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getTagsForType = useCallback(
    (targetType: TransactionType) => tags.filter((tag) => tag.type === targetType),
    [tags]
  )

  // Get available tags filtered by type
  const availableTags = useMemo(() => getTagsForType(type), [getTagsForType, type])

  // Load transaction data when modal opens
  useEffect(() => {
    if (transaction && open) {
      setType(transaction.type)
      // Convert ISO string to YYYY-MM-DD format
      let dateStr = format(new Date(), 'yyyy-MM-dd')
      if (transaction.occurredAt) {
        try {
          // Handle both ISO strings and YYYY-MM-DD format
          const date = transaction.occurredAt.includes('T') 
            ? parseISO(transaction.occurredAt)
            : new Date(transaction.occurredAt)
          if (!isNaN(date.getTime())) {
            dateStr = format(date, 'yyyy-MM-dd')
          }
        } catch {
          // If parsing fails, use today's date
        }
      }
      setDate(dateStr)
      setAmount(transaction.amountMinor)
      setCurrency(transaction.currency)
      setDescription(transaction.note || '')

      const tagIds = getTagsForType(transaction.type)
        .filter((tag) => transaction.tags.includes(tag.name))
        .map((tag) => tag.id)
      setSelectedTags(tagIds)

      setErrors({})
    } else if (open && !transaction) {
      // Reset to defaults when opening without a transaction
      setDate(format(new Date(), 'yyyy-MM-dd'))
    }
  }, [transaction, open, getTagsForType])

  const handleTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: TransactionType | null
  ) => {
    if (newType !== null) {
      setType(newType)
      const validTags = new Set(getTagsForType(newType).map((tag) => tag.id))
      setSelectedTags((prev) => prev.filter((id) => validTags.has(id)))
      setErrors({})
    }
  }

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId)
      }
      return [...prev, tagId]
    })
    setErrors((prev) => ({ ...prev, tags: undefined }))
  }

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!date) {
      newErrors.date = 'Date is required'
    }

    if (amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    if (!currency) {
      newErrors.currency = 'Currency is required'
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (selectedTags.length === 0) {
      newErrors.tags = 'At least one tag is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!transaction) return

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Get tag names from selected tag IDs
      const tagNames = availableTags
        .filter((tag) => selectedTags.includes(tag.id))
        .map((tag) => tag.name)

      const response = await api.updateTransaction(transaction.id, {
        profile: transaction.profile,
        occurredAt: date,
        amountMinor: amount,
        currency,
        type,
        tags: tagNames,
        note: description.trim() || undefined,
      })

      if (response.success) {
        onSuccess()
        onClose()
      } else {
        setErrors({
          ...errors,
          description: !response.success
            ? response.error.message
            : 'Failed to update transaction',
        })
      }
    } catch (error: any) {
      setErrors({
        ...errors,
        description: error.message || 'An error occurred while updating the transaction',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!transaction) return null

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{ sx: standardDialogPaperSx }}
    >
      <DialogTitle sx={{ textAlign: 'center' }}>Edit Transaction</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Transaction Type Toggle */}
          <Box sx={{ mb: 3, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ textAlign: 'center' }}>
              Type
            </Typography>
            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={handleTypeChange}
              fullWidth
              size="large"
            >
              <ToggleButton value="expense" color="error">
                <TrendingDownIcon sx={{ mr: 1 }} />
                Expense
              </ToggleButton>
              <ToggleButton value="income" color="success">
                <TrendingUpIcon sx={{ mr: 1 }} />
                Income
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Date Picker */}
          <Box sx={{ mb: 3, width: '100%' }}>
            <DatePicker
              label="Date"
              value={date}
              onChange={setDate}
              error={!!errors.date}
              helperText={errors.date}
              required
            />
          </Box>

          {/* Amount and Currency */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, width: '100%', justifyContent: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <AmountInput
                label="Amount"
                value={amount}
                onChange={setAmount}
                currency={currency}
                error={!!errors.amount}
                helperText={errors.amount}
                required
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <CurrencySelector
                value={currency}
                onChange={setCurrency}
                error={!!errors.currency}
                helperText={errors.currency}
                required
              />
            </Box>
          </Box>

          {/* Description */}
          <Box sx={{ mb: 3, width: '100%' }}>
            <TextField
              label="Description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setErrors((prev) => ({ ...prev, description: undefined }))
              }}
              error={!!errors.description}
              helperText={errors.description}
              required
              fullWidth
              multiline
              rows={3}
            />
          </Box>

          {/* Tags */}
          <Box sx={{ mb: 3, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ textAlign: 'center' }}>
              Tags <Typography component="span" variant="caption" color="error">*</Typography>
            </Typography>
            {availableTags.length === 0 ? (
              <Typography variant="body2" color="error" sx={{ mt: 1, textAlign: 'center' }}>
                No {type} tags available yet. Please create at least one tag from the Tags page before editing this transaction.
              </Typography>
            ) : (
              <>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, justifyContent: 'center' }}>
                  {availableTags.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      onClick={() => handleTagToggle(tag.id)}
                      color={selectedTags.includes(tag.id) ? 'primary' : 'default'}
                      variant={selectedTags.includes(tag.id) ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
                {errors.tags && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                    {errors.tags}
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center' }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

