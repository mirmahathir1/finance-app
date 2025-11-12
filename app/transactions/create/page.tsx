'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Card,
  CardContent,
  Divider,
  CircularProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material'
import { PageLayout } from '@/components/PageLayout'
import { DatePicker } from '@/components/DatePicker'
import { AmountInput } from '@/components/AmountInput'
import { CurrencySelector } from '@/components/CurrencySelector'
import { Snackbar } from '@/components/Snackbar'
import { useProfile } from '@/contexts/ProfileContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useTag } from '@/contexts/TagContext'
import { useApi } from '@/utils/useApi'
import { formatAmount } from '@/utils/amount'
import { format } from 'date-fns'
import type { TransactionType, Transaction } from '@/types'

export default function CreateTransactionPage() {
  const router = useRouter()
  const { activeProfile } = useProfile()
  const { defaultCurrency } = useCurrency()
  const { tags } = useTag()
  const api = useApi()

  // Form state
  const [type, setType] = useState<TransactionType>('expense')
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [amount, setAmount] = useState<number>(0)
  const [currency, setCurrency] = useState<string>(defaultCurrency?.code || 'USD')
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
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  // Recent transactions state
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [isLoadingRecent, setIsLoadingRecent] = useState(true)

  // Get available tags filtered by type - memoized to prevent infinite loops
  const availableTags = useMemo(() => tags.filter((tag) => tag.type === type), [tags, type])

  // Update currency when default currency changes
  useEffect(() => {
    if (defaultCurrency && !currency) {
      setCurrency(defaultCurrency.code)
    }
  }, [defaultCurrency, currency])

  // Load recent transactions
  useEffect(() => {
    const loadRecentTransactions = async () => {
      if (!activeProfile) {
        setIsLoadingRecent(false)
        return
      }

      try {
        setIsLoadingRecent(true)
        const response = await api.getTransactions({
          profile: activeProfile,
          limit: 5,
        })

        if (response.success && response.data) {
          setRecentTransactions(response.data.transactions || [])
        }
      } catch (error) {
        console.error('Error loading recent transactions:', error)
      } finally {
        setIsLoadingRecent(false)
      }
    }

    loadRecentTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile])

  // Update available tags when type changes
  useEffect(() => {
    // Clear selected tags if they're not available for the new type
    const availableTagIds = availableTags.map((t) => t.id)
    setSelectedTags((prev) => {
      const filtered = prev.filter((id) => availableTagIds.includes(id))
      // Only update if something changed to prevent infinite loops
      return filtered.length !== prev.length ? filtered : prev
    })
  }, [type, availableTags])

  const handleTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: TransactionType | null
  ) => {
    if (newType !== null) {
      setType(newType)
      setErrors({})
    }
  }

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId)
      } else {
        return [...prev, tagId]
      }
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
    if (!activeProfile) {
      setSnackbar({
        open: true,
        message: 'Please select a profile first',
        severity: 'error',
      })
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Get tag names from selected tag IDs
      const tagNames = availableTags
        .filter((tag) => selectedTags.includes(tag.id))
        .map((tag) => tag.name)

      const response = await api.createTransaction({
        profile: activeProfile,
        occurredAt: date,
        amountMinor: amount,
        currency,
        type,
        tags: tagNames,
        note: description.trim() || undefined,
      })

      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Transaction created successfully!',
          severity: 'success',
        })

        // Reset form
        setType('expense')
        setDate(format(new Date(), 'yyyy-MM-dd'))
        setAmount(0)
        setCurrency(defaultCurrency?.code || 'USD')
        setDescription('')
        setSelectedTags([])
        setErrors({})

        // Reload recent transactions
        const recentResponse = await api.getTransactions({
          profile: activeProfile,
          limit: 5,
        })
        if (recentResponse.success && recentResponse.data) {
          setRecentTransactions(recentResponse.data.transactions || [])
        }

        // Optionally redirect after a short delay
        setTimeout(() => {
          router.push('/transactions')
        }, 1500)
      } else {
        setSnackbar({
          open: true,
          message: response.error?.message || 'Failed to create transaction',
          severity: 'error',
        })
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'An error occurred while creating the transaction',
        severity: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!activeProfile) {
    return (
      <PageLayout>
        <Container maxWidth="md">
          <Alert severity="warning" sx={{ mt: 4 }}>
            Please select a profile first to create transactions.
          </Alert>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/')}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Container>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/transactions')}
            sx={{ mb: 2 }}
          >
            Back to Transactions
          </Button>
          <Typography variant="h4" gutterBottom>
            Create Transaction
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add a new expense or income transaction
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
          {/* Main Form */}
          <Box sx={{ flex: 1 }}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Transaction Details
              </Typography>

              {/* Transaction Type Toggle */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
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
              <Box sx={{ mb: 3 }}>
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
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
              <Box sx={{ mb: 3 }}>
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
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tags {errors.tags && <span style={{ color: 'red' }}>*</span>}
                </Typography>
                {availableTags.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    No {type} tags available. Please create tags first.
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
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
                )}
                {errors.tags && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {errors.tags}
                  </Typography>
                )}
              </Box>

              {/* Submit Button */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/transactions')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Transaction'}
                </Button>
              </Box>
            </Paper>
          </Box>

          {/* Recent Transactions Sidebar */}
          <Box sx={{ width: { xs: '100%', lg: 350 } }}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              <Divider sx={{ my: 2 }} />

              {isLoadingRecent ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : recentTransactions.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No recent transactions
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recentTransactions.map((transaction) => (
                    <Card key={transaction.id} variant="outlined">
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 1,
                          }}
                        >
                          <Typography variant="body2" fontWeight="bold" noWrap sx={{ flex: 1 }}>
                            {transaction.note || 'No description'}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={transaction.type === 'expense' ? 'error.main' : 'success.main'}
                          >
                            {transaction.type === 'expense' ? '-' : '+'}
                            {formatAmount(transaction.amountMinor, transaction.currency)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(transaction.occurredAt), 'MMM d, yyyy')}
                        </Typography>
                        {transaction.tags.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                            {transaction.tags.slice(0, 3).map((tagName) => (
                              <Chip
                                key={tagName}
                                label={tagName}
                                size="small"
                                sx={{
                                  backgroundColor:
                                    transaction.type === 'expense'
                                      ? 'error.light'
                                      : 'success.light',
                                  color:
                                    transaction.type === 'expense'
                                      ? 'error.contrastText'
                                      : 'success.contrastText',
                                }}
                              />
                            ))}
                            {transaction.tags.length > 3 && (
                              <Typography variant="caption" color="text.secondary">
                                +{transaction.tags.length - 3}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        </Box>

        <Snackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </Container>
    </PageLayout>
  )
}

