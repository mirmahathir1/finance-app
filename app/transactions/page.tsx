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
import { EditTransactionModal } from '@/components/EditTransactionModal'
import { DeleteTransactionModal } from '@/components/DeleteTransactionModal'
import { Snackbar } from '@/components/Snackbar'
import { useProfile } from '@/contexts/ProfileContext'
import { useTag } from '@/contexts/TagContext'
import { useApi } from '@/utils/useApi'
import { formatAmount } from '@/utils/amount'
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import type { Transaction, TransactionType } from '@/types'

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

  // Load transactions
  useEffect(() => {
    const loadTransactions = async () => {
      if (!activeProfile) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const params: any = {
          profile: activeProfile,
        }

        if (dateFrom) params.from = dateFrom
        if (dateTo) params.to = dateTo

        const response = await api.getTransactions(params)

        if (response.success && response.data) {
          setTransactions(response.data.transactions || [])
          // Expand first month by default
          if (response.data.transactions && response.data.transactions.length > 0) {
            const firstTransaction = response.data.transactions[0]
            const firstDate = parseISO(firstTransaction.occurredAt)
            const firstMonthKey = `${firstDate.getFullYear()}-${firstDate.getMonth()}`
            setExpandedMonths(new Set([firstMonthKey]))
          }
        }
      } catch (error) {
        console.error('Error loading transactions:', error)
        setSnackbar({
          open: true,
          message: 'Failed to load transactions',
          severity: 'error',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile, dateFrom, dateTo])

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

    // Reload transactions
    if (activeProfile) {
      const params: any = {
        profile: activeProfile,
      }

      if (dateFrom) params.from = dateFrom
      if (dateTo) params.to = dateTo

      const response = await api.getTransactions(params)
      if (response.success && response.data) {
        setTransactions(response.data.transactions || [])
      }
    }
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
        const params: any = {
          profile: activeProfile!,
        }

        if (dateFrom) params.from = dateFrom
        if (dateTo) params.to = dateTo

        const reloadResponse = await api.getTransactions(params)
        if (reloadResponse.success && reloadResponse.data) {
          setTransactions(reloadResponse.data.transactions || [])
        }

        setDeleteDialogOpen(false)
        setTransactionToDelete(null)
      } else {
        setSnackbar({
          open: true,
          message: response.error?.message || 'Failed to delete transaction',
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

  if (!activeProfile) {
    return (
      <PageLayout>
        <Container maxWidth="lg">
          <Alert severity="warning" sx={{ mt: 4 }}>
            Please select a profile first to view transactions.
          </Alert>
        </Container>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4">Transactions</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => router.push('/')}
              >
                Back to Dashboard
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => router.push('/transactions/create')}
              >
                Create Transaction
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Filter Controls */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
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

        {/* Transactions List */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
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
          <Box>
            {groupedTransactions.map((group) => {
              const monthKey = `${group.year}-${group.month}`
              const isExpanded = expandedMonths.has(monthKey)

              return (
                <Accordion
                  key={monthKey}
                  expanded={isExpanded}
                  onChange={() => handleMonthToggle(monthKey)}
                  sx={{ mb: 2 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                      <Typography variant="h6">{group.monthLabel}</Typography>
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Typography variant="body2" color="success.main">
                          Income: {formatAmount(group.summary.income, group.summary.currency)}
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          Expense: {formatAmount(group.summary.expense, group.summary.currency)}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color={group.summary.balance >= 0 ? 'success.main' : 'error.main'}>
                          Balance: {formatAmount(group.summary.balance, group.summary.currency)}
                        </Typography>
                      </Box>
                    </Box>
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
                                  {transaction.tags.map((tag) => (
                                    <Chip
                                      key={tag}
                                      label={tag}
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
                                  onClick={() => handleEditClick(transaction)}
                                  color="primary"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
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

