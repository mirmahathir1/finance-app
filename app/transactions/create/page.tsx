'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
  Skeleton,
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
import { TagChip } from '@/components/TagChip'
import { Snackbar } from '@/components/Snackbar'
import { useProfile } from '@/contexts/ProfileContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useTag } from '@/contexts/TagContext'
import { useApi } from '@/utils/useApi'
import { formatAmount } from '@/utils/amount'
import { format } from 'date-fns'
import type { TransactionType, Transaction } from '@/types'
import { ErrorState } from '@/components/ErrorState'
import { LoadingButton } from '@/components/LoadingButton'
import { getFriendlyErrorMessage } from '@/utils/error'

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
  const [currency, setCurrency] = useState<string>(defaultCurrency?.code || '')
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
  const [recentError, setRecentError] = useState<string | null>(null)

  // Get available tags filtered by type - memoized to prevent infinite loops
  const availableTags = useMemo(() => tags.filter((tag) => tag.type === type), [tags, type])

  // Update currency when default currency changes
  useEffect(() => {
    if (defaultCurrency && !currency) {
      setCurrency(defaultCurrency.code)
    }
  }, [defaultCurrency, currency])

  // Load recent transactions
  const loadRecentTransactions = useCallback(async () => {
    if (!activeProfile) {
      setRecentTransactions([])
      setIsLoadingRecent(false)
      setRecentError(null)
      return
    }

    try {
      setIsLoadingRecent(true)
      setRecentError(null)
      const response = await api.getTransactions({
        profile: activeProfile,
        limit: 5,
      })

      if (response.success && response.data) {
        setRecentTransactions(response.data.transactions || [])
      } else {
        setRecentTransactions([])
        setRecentError(
          !response.success
            ? response.error.message
            : 'Failed to load recent transactions.'
        )
      }
    } catch (error) {
      const message = getFriendlyErrorMessage(error, 'Failed to load recent transactions.')
      setRecentTransactions([])
      setRecentError(message)
    } finally {
      setIsLoadingRecent(false)
    }
  }, [activeProfile, api])

  const recentFetchKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const key = activeProfile ?? 'none'

    if (recentFetchKeyRef.current === key) {
      return
    }

    recentFetchKeyRef.current = key

    ;(async () => {
      try {
        await loadRecentTransactions()
      } finally {
        if (recentFetchKeyRef.current === key) {
          recentFetchKeyRef.current = null
        }
      }
    })()
  }, [activeProfile, loadRecentTransactions])

  const handleRetryRecentTransactions = () => {
    loadRecentTransactions()
  }

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
      }
      return [...prev, tagId]
    })
  }

  const handleDateChange = (value: string) => {
    setDate(value)
    setErrors((prev) => ({
      ...prev,
      date: value ? undefined : 'Date is required',
    }))
  }

  const handleAmountChange = (value: number) => {
    setAmount(value)
    setErrors((prev) => ({
      ...prev,
      amount: value > 0 ? undefined : 'Amount must be greater than 0',
    }))
  }

  const handleCurrencyChange = (value: string) => {
    setCurrency(value)
    setErrors((prev) => ({
      ...prev,
      currency: value ? undefined : 'Currency is required',
    }))
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    setErrors((prev) => ({
      ...prev,
      description: value.trim() ? undefined : 'Description is required',
    }))
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

  const isFormValid =
    !!date &&
    amount > 0 &&
    !!currency &&
    !!description.trim() &&
    selectedTags.length > 0 &&
    Object.values(errors).every((error) => !error)

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
        setCurrency(defaultCurrency?.code || '')
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

        // Stay on the page so users can keep adding transactions
      } else {
        setSnackbar({
          open: true,
          message: !response.success
            ? response.error.message
            : 'Failed to create transaction',
          severity: 'error',
        })
      }
    } catch (error: any) {
      const message = getFriendlyErrorMessage(error, 'An error occurred while creating the transaction.')
      setSnackbar({
        open: true,
        message,
        severity: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const bannerActions = (
    <Button
      variant="contained"
      color="primary"
      startIcon={<ArrowBackIcon />}
      onClick={() => router.push('/')}
    >
      Back to Dashboard
    </Button>
  )

  if (!activeProfile) {
    return (
      <PageLayout pageName="Create Transaction" bannerActions={bannerActions}>
        <Container maxWidth="md">
          <Alert severity="warning" sx={{ mt: 4 }}>
            Please select a profile first to create transactions.
          </Alert>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
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
    <PageLayout pageName="Create Transaction" bannerActions={bannerActions}>
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/transactions')}
            sx={{ mb: 2 }}
          >
            Back to Transactions
          </Button>
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
                  onChange={handleDateChange}
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
                    onChange={handleAmountChange}
                    currency={currency}
                    error={!!errors.amount}
                    helperText={errors.amount}
                    required
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <CurrencySelector
                    value={currency}
                    onChange={handleCurrencyChange}
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
                  onChange={(e) => handleDescriptionChange(e.target.value)}
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
                  Tags <Typography component="span" variant="caption" color="error">*</Typography>
                </Typography>
                {availableTags.length === 0 ? (
                  <Alert 
                    severity="warning" 
                    sx={{ mt: 1 }}
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        onClick={() => router.push('/tags')}
                      >
                        Go to Tags
                      </Button>
                    }
                  >
                    No {type} tags available yet. Please create at least one tag from the Tags page before creating a transaction.
                  </Alert>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {availableTags.map((tag) => (
                        <Chip
                          key={tag.id}
                          label={tag.name}
                          onClick={() => {
                            handleTagToggle(tag.id)
                            setErrors((prev) => ({ ...prev, tags: undefined }))
                          }}
                          color={selectedTags.includes(tag.id) ? 'primary' : 'default'}
                          variant={selectedTags.includes(tag.id) ? 'filled' : 'outlined'}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                    {errors.tags && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                        {errors.tags}
                      </Typography>
                    )}
                  </>
                )}
              </Box>

              {/* Submit Button */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={() => router.push('/transactions')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <LoadingButton
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting || !isFormValid}
                >
                  {isSubmitting ? 'Creating...' : 'Create Transaction'}
                </LoadingButton>
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

              {recentError ? (
                <ErrorState
                  title="Unable to load recent transactions"
                  message={recentError}
                  onRetry={handleRetryRecentTransactions}
                  compact
                />
              ) : isLoadingRecent ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} variant="rounded" height={84} />
                  ))}
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
                            {transaction.tags.slice(0, 3).map((tagName) => {
                              // Find the tag object by name to get the type
                              const tag = tags.find((t) => t.name === tagName)
                              if (tag) {
                                return <TagChip key={tag.id} tag={tag} size="small" />
                              }
                              // Fallback if tag not found
                              return (
                                <Chip
                                  key={tagName}
                                  label={tagName}
                                  size="small"
                                  sx={{
                                    border: `4px solid ${transaction.type === 'expense' ? '#c62828' : '#2e7d32'}`,
                                    borderColor: transaction.type === 'expense' ? '#c62828' : '#2e7d32',
                                  }}
                                />
                              )
                            })}
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

