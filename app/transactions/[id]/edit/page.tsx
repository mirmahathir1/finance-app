'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Alert,
  Skeleton,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { PageLayout } from '@/components/PageLayout'
import { DatePicker } from '@/components/DatePicker'
import { AmountInput } from '@/components/AmountInput'
import { CurrencySelector } from '@/components/CurrencySelector'
import { Snackbar } from '@/components/Snackbar'
import { LoadingButton } from '@/components/LoadingButton'
import { ErrorState } from '@/components/ErrorState'
import { useProfile } from '@/contexts/ProfileContext'
import { useTag } from '@/contexts/TagContext'
import { useApi } from '@/utils/useApi'
import { getFriendlyErrorMessage } from '@/utils/error'
import type { Transaction, TransactionType } from '@/types'
import { format, parseISO } from 'date-fns'

const DeleteTransactionModal = dynamic(
  () =>
    import('@/components/DeleteTransactionModal').then((mod) => ({
      default: mod.DeleteTransactionModal,
    })),
  { loading: () => null, ssr: false }
)

function normalizeDate(value: string) {
  try {
    const date = value.includes('T') ? parseISO(value) : new Date(value)
    if (!isNaN(date.getTime())) {
      return format(date, 'yyyy-MM-dd')
    }
  } catch {
    // Fallback handled below
  }
  return format(new Date(), 'yyyy-MM-dd')
}

export default function EditTransactionPage() {
  const router = useRouter()
  const params = useParams()
  const transactionId = useMemo(() => {
    const idParam = params?.id
    if (Array.isArray(idParam)) return idParam[0]
    return idParam || ''
  }, [params])

  const { activeProfile } = useProfile()
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  // Load state
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const tagsInitializedRef = useRef(false)

  const getTagsForType = useCallback(
    (targetType: TransactionType) => tags.filter((tag) => tag.type === targetType),
    [tags]
  )

  // Available tags filtered by type
  const availableTags = useMemo(() => getTagsForType(type), [getTagsForType, type])

  // Fetch transaction details
  const fetchTransaction = useCallback(async () => {
    if (!transactionId) return

    try {
      setIsLoading(true)
      setLoadError(null)
      const response = await api.getTransaction(transactionId)

      if (response.success && response.data?.transaction) {
        const tx = response.data.transaction
        setTransaction(tx)
        setType(tx.type)
        setDate(normalizeDate(tx.occurredAt))
        setAmount(tx.amountMinor)
        setCurrency(tx.currency)
        setDescription(tx.note || '')
        tagsInitializedRef.current = false
      } else {
        setLoadError(
          !response.success ? response.error.message : 'Failed to load transaction.'
        )
        setTransaction(null)
      }
    } catch (error) {
      setLoadError(getFriendlyErrorMessage(error, 'Failed to load transaction.'))
      setTransaction(null)
    } finally {
      setIsLoading(false)
    }
  }, [api, transactionId])

  useEffect(() => {
    fetchTransaction()
  }, [fetchTransaction])

  // Initialize tag selection after transaction load
  useEffect(() => {
    if (!transaction || tagsInitializedRef.current) return
    const tagIds = getTagsForType(transaction.type)
      .filter((tag) => transaction.tags.includes(tag.name))
      .map((tag) => tag.id)

    setSelectedTags(tagIds)
    tagsInitializedRef.current = true
  }, [transaction, getTagsForType])

  // Clear invalid tags when type changes
  useEffect(() => {
    const validTagIds = new Set(availableTags.map((tag) => tag.id))
    setSelectedTags((prev) => prev.filter((id) => validTagIds.has(id)))
  }, [availableTags])

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

  const isFormValid =
    !!date &&
    amount > 0 &&
    !!currency &&
    !!description.trim() &&
    selectedTags.length > 0 &&
    Object.values(errors).every((error) => !error)

  const handleSubmit = async () => {
    if (!transaction || !transactionId) {
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const tagNames = availableTags
        .filter((tag) => selectedTags.includes(tag.id))
        .map((tag) => tag.name)

      const response = await api.updateTransaction(transactionId, {
        profile: transaction.profile,
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
          message: 'Transaction updated successfully',
          severity: 'success',
        })
        router.push('/statistics')
      } else {
        setSnackbar({
          open: true,
          message: !response.success
            ? response.error.message
            : 'Failed to update transaction',
          severity: 'error',
        })
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: getFriendlyErrorMessage(error, 'An error occurred while updating.'),
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

  if (!transactionId) {
    return (
      <PageLayout pageName="Edit Transaction" bannerActions={bannerActions}>
        <Container maxWidth="md">
          <ErrorState
            title="Transaction not found"
            message="Missing transaction identifier in the URL."
            onRetry={() => router.push('/statistics')}
          />
        </Container>
      </PageLayout>
    )
  }

  if (loadError) {
    return (
      <PageLayout pageName="Edit Transaction" bannerActions={bannerActions}>
        <Container maxWidth="md">
          <Box sx={{ mt: 4 }}>
            <ErrorState
              title="Unable to load transaction"
              message={loadError}
              onRetry={fetchTransaction}
            />
          </Box>
        </Container>
      </PageLayout>
    )
  }

  const handleDeleteConfirm = async () => {
    if (!transactionId) return
    setIsDeleting(true)
    try {
      const response = await api.deleteTransaction(transactionId)
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Transaction deleted successfully',
          severity: 'success',
        })
        router.push('/statistics')
      } else {
        setSnackbar({
          open: true,
          message: !response.success
            ? response.error.message
            : 'Failed to delete transaction',
          severity: 'error',
        })
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: getFriendlyErrorMessage(error, 'An error occurred while deleting.'),
        severity: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <PageLayout pageName="Edit Transaction" bannerActions={bannerActions}>
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/statistics')}
            sx={{ mb: 2 }}
          >
            Back to Transactions
          </Button>
          <Typography variant="body2" color="text.secondary">
            Update an existing expense or income entry
          </Typography>
        </Box>

        {isLoading || !transaction ? (
          <Paper elevation={2} sx={{ p: 3, borderRadius: '30px' }}>
            <Skeleton variant="text" width="40%" height={32} />
            <Skeleton variant="rounded" height={48} sx={{ mt: 2 }} />
            <Skeleton variant="rounded" height={48} sx={{ mt: 2 }} />
            <Skeleton variant="rounded" height={96} sx={{ mt: 2 }} />
          </Paper>
        ) : (
          <Paper elevation={2} sx={{ p: 3, borderRadius: '30px' }}>
            {!activeProfile && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No profile selected. Editing may be limited until a profile is active.
              </Alert>
            )}

            <Typography variant="h6" gutterBottom>
              Edit Transaction
            </Typography>

            {/* Type */}
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

            {/* Date */}
            <Box sx={{ mb: 3 }}>
              <DatePicker
                label="Date"
                value={date}
                onChange={(value) => {
                  setDate(value)
                  setErrors((prev) => ({ ...prev, date: value ? undefined : 'Date is required' }))
                }}
                error={!!errors.date}
                helperText={errors.date}
                required
              />
            </Box>

            {/* Amount and Currency */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <AmountInput
                  label="Amount"
                  value={amount}
                  onChange={(value) => {
                    setAmount(value)
                    setErrors((prev) => ({
                      ...prev,
                      amount: value > 0 ? undefined : 'Amount must be greater than 0',
                    }))
                  }}
                  currency={currency}
                  error={!!errors.amount}
                  helperText={errors.amount}
                  required
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <CurrencySelector
                  value={currency}
                  onChange={(value) => {
                    setCurrency(value)
                    setErrors((prev) => ({
                      ...prev,
                      currency: value ? undefined : 'Currency is required',
                    }))
                  }}
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
                  setErrors((prev) => ({
                    ...prev,
                    description: e.target.value.trim()
                      ? undefined
                      : 'Description is required',
                  }))
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
                Tags{' '}
                <Typography component="span" variant="caption" color="error">
                  *
                </Typography>
              </Typography>
              {availableTags.length === 0 ? (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  No {type} tags available yet. Please create at least one tag from the Tags
                  page before editing this transaction.
                </Alert>
              ) : (
                <>
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
                  {errors.tags && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                      {errors.tags}
                    </Typography>
                  )}
                </>
              )}
            </Box>

            {/* Actions */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'space-between',
                flexWrap: 'wrap',
              }}
            >
              <LoadingButton
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                loading={isDeleting}
                disabled={isSubmitting || isDeleting}
              >
                Delete
              </LoadingButton>

              <Button
                variant="contained"
                onClick={() => router.push('/statistics')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <LoadingButton
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </LoadingButton>
            </Box>
          </Paper>
        )}

        <Snackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />

        <DeleteTransactionModal
          open={deleteDialogOpen}
          transaction={transaction}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            if (!isDeleting) {
              setDeleteDialogOpen(false)
            }
          }}
          isDeleting={isDeleting}
        />
      </Container>
    </PageLayout>
  )
}

