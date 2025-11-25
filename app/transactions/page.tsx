'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material'
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { PageLayout } from '@/components/PageLayout'
import { EmptyState } from '@/components/EmptyState'
import { Snackbar } from '@/components/Snackbar'
import { TagChip } from '@/components/TagChip'
import { useProfile } from '@/contexts/ProfileContext'
import { useTag } from '@/contexts/TagContext'
import { useApi } from '@/utils/useApi'
import { formatAmount } from '@/utils/amount'
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import type { Transaction, TransactionType } from '@/types'
import { ErrorState } from '@/components/ErrorState'
import { getFriendlyErrorMessage } from '@/utils/error'
import { AnimatedSection } from '@/components/AnimatedSection'

const EditTransactionModal = dynamic(
  () =>
    import('@/components/EditTransactionModal').then((mod) => ({
      default: mod.EditTransactionModal,
    })),
  { loading: () => null, ssr: false }
)

const DeleteTransactionModal = dynamic(
  () =>
    import('@/components/DeleteTransactionModal').then((mod) => ({
      default: mod.DeleteTransactionModal,
    })),
  { loading: () => null, ssr: false }
)

interface MonthGroup {
  year: number
  month: number
  monthLabel: string
  transactions: Transaction[]
  summary: {
    income: number
    expense: number
    balance: number
    currency: string
  }
}

export default function TransactionsPage() {
  const router = useRouter()
  const { activeProfile } = useProfile()
  const { tags } = useTag()
  const api = useApi()

  // Filter state
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  const loadTransactions = useCallback(async () => {
    if (!activeProfile) {
      setTransactions([])
      setIsLoading(false)
      setLoadError(null)
      return
    }

    try {
      setIsLoading(true)
      setLoadError(null)

      const params: any = {
        profile: activeProfile,
        // No limit - fetch all transactions
      }

      if (dateFrom) params.from = dateFrom
      if (dateTo) params.to = dateTo

      const response = await api.getTransactions(params)

      if (response.success && response.data) {
        const txs = response.data.transactions || []
        setTransactions(txs)

        if (txs.length > 0) {
          const firstTransaction = txs[0]
          const firstDate = parseISO(firstTransaction.occurredAt)
          const firstMonthKey = `${firstDate.getFullYear()}-${firstDate.getMonth()}`
          setExpandedMonths(new Set([firstMonthKey]))
        }
      } else {
        setTransactions([])
        setLoadError(
          !response.success
            ? response.error.message
            : 'Failed to load transactions.'
        )
      }
    } catch (error) {
      const message = getFriendlyErrorMessage(error, 'Failed to load transactions.')
      setTransactions([])
      setLoadError(message)
      setSnackbar({
        open: true,
        message,
        severity: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }, [activeProfile, dateFrom, dateTo, api])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const handleRetryLoad = () => {
    loadTransactions()
  }

  // Filter and group transactions
  const groupedTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((t) => t.type === typeFilter)
    }

    // Filter by tag
    if (tagFilter !== 'all') {
      filtered = filtered.filter((t) => t.tags.includes(tagFilter))
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          (t.note?.toLowerCase().includes(query) || false) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    // Group by month
    const groups = new Map<string, MonthGroup>()

    filtered.forEach((transaction) => {
      const date = parseISO(transaction.occurredAt)
      const year = date.getFullYear()
      const month = date.getMonth()
      const key = `${year}-${month}`
      const monthLabel = format(date, 'MMMM yyyy')

      if (!groups.has(key)) {
        groups.set(key, {
          year,
          month,
          monthLabel,
          transactions: [],
          summary: {
            income: 0,
            expense: 0,
            balance: 0,
            currency: transaction.currency,
          },
        })
      }

      const group = groups.get(key)!
      group.transactions.push(transaction)

      // Update summary
      if (transaction.type === 'income') {
        group.summary.income += transaction.amountMinor
      } else {
        group.summary.expense += transaction.amountMinor
      }
    })

    // Calculate balance and sort
    const result = Array.from(groups.values())
      .map((group) => {
        group.summary.balance = group.summary.income - group.summary.expense
        group.transactions.sort(
          (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
        )
        return group
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })

    return result
  }, [transactions, typeFilter, tagFilter, searchQuery])

  // Get unique tags from transactions
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    transactions.forEach((t) => {
      t.tags.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [transactions])

  // Get transaction counts
  const transactionCounts = useMemo(() => {
    const all = transactions.length
    const expenses = transactions.filter((t) => t.type === 'expense').length
    const incomes = transactions.filter((t) => t.type === 'income').length
    return { all, expenses, incomes }
  }, [transactions])

  const handleEditClick = (transaction: Transaction) => {
    setTransactionToEdit(transaction)
    setEditDialogOpen(true)
  }

  const handleEditSuccess = async () => {
    setSnackbar({
      open: true,
      message: 'Transaction updated successfully',
      severity: 'success',
    })

    await loadTransactions()
  }

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return

    setIsDeleting(true)

    try {
      const response = await api.deleteTransaction(transactionToDelete.id)

      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Transaction deleted successfully',
          severity: 'success',
        })

        // Reload transactions with current filters
        await loadTransactions()

        setDeleteDialogOpen(false)
        setTransactionToDelete(null)
      } else {
        setSnackbar({
          open: true,
          message: !response.success
            ? response.error.message
            : 'Failed to delete transaction',
          severity: 'error',
        })
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'An error occurred while deleting the transaction',
        severity: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleMonthToggle = (monthKey: string) => {
    setExpandedMonths((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey)
      } else {
        newSet.add(monthKey)
      }
      return newSet
    })
  }

  const bannerActions = (
    <Button
      variant="outlined"
      color="inherit"
      onClick={() => router.push('/')}
      sx={{
        borderColor: 'rgba(255,255,255,0.8)',
        color: 'inherit',
        '&:hover': {
          borderColor: 'primary.contrastText',
          backgroundColor: 'rgba(255,255,255,0.15)',
        },
      }}
    >
      Back to Dashboard
    </Button>
  )

  if (!activeProfile) {
    return (
      <PageLayout pageName="Transactions" bannerActions={bannerActions}>
        <Container maxWidth="lg">
          <Alert severity="warning" sx={{ mt: 4 }}>
            Please select a profile first to view transactions.
          </Alert>
        </Container>
      </PageLayout>
    )
  }

  return (
    <PageLayout pageName="Transactions" bannerActions={bannerActions}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: { xs: 'flex-start', sm: 'flex-end' },
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
              mb: 2,
            }}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/transactions/create')}
            >
              Create Transaction
            </Button>
          </Box>
        </Box>

        {/* Filter Controls */}
        <AnimatedSection>
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: '30px' }}>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>

            {/* Type Filter Tabs */}
            <Box sx={{ mb: 3 }}>
              <Tabs
                value={typeFilter}
                onChange={(_, newValue) => setTypeFilter(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label={`All (${transactionCounts.all})`} value="all" />
                <Tab label={`Expense (${transactionCounts.expenses})`} value="expense" />
                <Tab label={`Income (${transactionCounts.incomes})`} value="income" />
              </Tabs>
            </Box>

            {/* Other Filters */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
              {/* Tag Filter */}
              <FormControl sx={{ minWidth: { xs: '100%', md: 200 } }}>
                <InputLabel>Tag</InputLabel>
                <Select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  label="Tag"
                >
                  <MenuItem value="all">All Tags</MenuItem>
                  {availableTags.map((tag) => (
                    <MenuItem key={tag} value={tag}>
                      {tag}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Search */}
              <TextField
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ flex: 1 }}
              />

              {/* Date Range (Optional) */}
              <Box sx={{ display: 'flex', gap: 1, minWidth: { xs: '100%', md: 300 } }}>
                <TextField
                  label="From"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="To"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: 1 }}
                />
                {(dateFrom || dateTo) && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setDateFrom('')
                      setDateTo('')
                    }}
                    sx={{ alignSelf: 'flex-end' }}
                  >
                    Clear
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </AnimatedSection>

        {/* Transactions List */}
        {loadError ? (
          <ErrorState
            title="Unable to load transactions"
            message={loadError}
            onRetry={handleRetryLoad}
          />
        ) : isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: '30px' }}>
              <Skeleton variant="text" width="30%" height={32} />
              <Skeleton variant="rectangular" height={56} sx={{ mt: 2, borderRadius: '30px' }} />
            </Paper>
            <Paper elevation={2} sx={{ p: 3, borderRadius: '30px' }}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rectangular"
                  height={72}
                  sx={{ borderRadius: '30px', mb: index !== 2 ? 2 : 0 }}
                />
              ))}
            </Paper>
          </Box>
        ) : groupedTransactions.length === 0 ? (
          <EmptyState
            icon={<SearchIcon />}
            title="No transactions found"
            message={
              transactions.length === 0
                ? 'Start by creating your first transaction'
                : 'No transactions match your filters'
            }
            action={
              transactions.length === 0 ? (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/transactions/create')}
                >
                  Create Transaction
                </Button>
              ) : (
                <Button variant="outlined" onClick={() => {
                  setTypeFilter('all')
                  setTagFilter('all')
                  setSearchQuery('')
                  setDateFrom('')
                  setDateTo('')
                }}>
                  Clear Filters
                </Button>
              )
            }
          />
        ) : (
          <AnimatedSection delay={80}>
            <Box sx={{ borderRadius: 0 }}>
            {groupedTransactions.map((group) => {
              const monthKey = `${group.year}-${group.month}`
              const isExpanded = expandedMonths.has(monthKey)

              return (
                <Accordion
                  key={monthKey}
                  expanded={isExpanded}
                  onChange={() => handleMonthToggle(monthKey)}
                  sx={{ 
                    mb: 2, 
                    borderRadius: '30px !important',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': {
                      borderRadius: '30px !important',
                    },
                    '& .MuiAccordionSummary-root': {
                      borderRadius: isExpanded ? '30px 30px 0 0 !important' : '30px !important',
                    },
                    '& .MuiAccordionDetails-root': {
                      borderRadius: '0 0 30px 30px !important',
                    },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">{group.monthLabel}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Tags</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {group.transactions.map((transaction) => (
                            <TableRow key={transaction.id} hover>
                              <TableCell>
                                {format(parseISO(transaction.occurredAt), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell>
                                {transaction.note || <em>No description</em>}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {transaction.tags.map((tagName) => {
                                    // Find the tag object by name to get the type
                                    const tag = tags.find((t) => t.name === tagName)
                                    if (tag) {
                                      return <TagChip key={tag.id} tag={tag} size="small" />
                                    }
                                    // Fallback if tag not found (shouldn't happen, but handle gracefully)
                                    return (
                                      <Chip
                                        key={tagName}
                                        label={tagName}
                                        size="small"
                                        sx={{
                                          border: `4px solid ${transaction.type === 'expense' ? '#f44336' : '#4caf50'}`,
                                          borderColor: transaction.type === 'expense' ? '#f44336' : '#4caf50',
                                        }}
                                      />
                                    )
                                  })}
                                </Box>
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  color:
                                    transaction.type === 'expense' ? 'error.main' : 'success.main',
                                  fontWeight: 'bold',
                                }}
                              >
                                {transaction.type === 'expense' ? '-' : '+'}
                                {formatAmount(transaction.amountMinor, transaction.currency)}
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => handleEditClick(transaction)}
                                  color="primary"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => handleDeleteClick(transaction)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              )
            })}
            </Box>
          </AnimatedSection>
        )}

        {/* Edit Transaction Modal */}
        <EditTransactionModal
          open={editDialogOpen}
          transaction={transactionToEdit}
          onClose={() => {
            setEditDialogOpen(false)
            setTransactionToEdit(null)
          }}
          onSuccess={handleEditSuccess}
        />

        {/* Delete Transaction Modal */}
        <DeleteTransactionModal
          open={deleteDialogOpen}
          transaction={transactionToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            if (!isDeleting) {
              setDeleteDialogOpen(false)
              setTransactionToDelete(null)
            }
          }}
          isDeleting={isDeleting}
        />

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

