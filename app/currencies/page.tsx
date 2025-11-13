'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Container,
  Divider,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { PageLayout } from '@/components/PageLayout'
import { Snackbar } from '@/components/Snackbar'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useCurrency } from '@/contexts/CurrencyContext'
import { EditCurrencyModal } from '@/components/EditCurrencyModal'
import { DeleteCurrencyModal } from '@/components/DeleteCurrencyModal'
import type { Currency } from '@/types'

export default function CurrenciesPage() {
  const router = useRouter()
  const {
    currencies,
    defaultCurrency,
    isLoading,
    addCurrency,
    deleteCurrency,
    setDefaultCurrency,
    importCurrenciesFromTransactions,
  } = useCurrency()

  // Create form state
  const [newCode, setNewCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Edit state
  const [editOpen, setEditOpen] = useState(false)
  const [currencyToEdit, setCurrencyToEdit] = useState<Currency | null>(null)

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  const sortedCurrencies = useMemo(() => {
    return [...currencies].sort((a, b) => {
      if (a.isDefault === b.isDefault) return a.code.localeCompare(b.code)
      return a.isDefault ? -1 : 1
    })
  }, [currencies])

  const handleImport = async () => {
    try {
      const { added, skipped } = await importCurrenciesFromTransactions()
      setSnackbar({
        open: true,
        message: `Import complete: added ${added}, skipped ${skipped}`,
        severity: 'success',
      })
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.message || 'Failed to import currencies',
        severity: 'error',
      })
    }
  }

  const handleCreate = async () => {
    if (!newCode.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a currency code',
        severity: 'warning',
      })
      return
    }
    try {
      setIsCreating(true)
      await addCurrency(newCode.trim().toUpperCase(), currencies.length === 0)
      setNewCode('')
      setSnackbar({
        open: true,
        message: 'Currency added',
        severity: 'success',
      })
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.message || 'Failed to add currency',
        severity: 'error',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const openDelete = (code: string) => {
    setCodeToDelete(code)
    setDeleteOpen(true)
  }

  const openEdit = (currency: Currency) => {
    setCurrencyToEdit(currency)
    setEditOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!codeToDelete) return
    // Deletion now handled by DeleteCurrencyModal
  }

  return (
    <PageLayout>
      <Container maxWidth="md">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Manage Currencies</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => router.push('/')}>
              Back to Dashboard
            </Button>
            <Button variant="outlined" onClick={handleImport}>
              Import from Database
            </Button>
          </Box>
        </Box>

        {/* Create Currency Form */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add Currency
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Currency Code (e.g., USD)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              inputProps={{ maxLength: 3 }}
              fullWidth
              disabled={isLoading || isCreating}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCreate()
                }
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              disabled={isLoading || isCreating}
            >
              Add
            </Button>
          </Stack>
        </Paper>

        {/* Currencies List */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Currencies</Typography>
            {defaultCurrency && (
              <Typography variant="body2" color="text.secondary">
                Default: <strong>{defaultCurrency.code}</strong>
              </Typography>
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            {sortedCurrencies.map((c) => (
              <ListItem key={c.code} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">{c.code}</Typography>
                      {c.isDefault && <Chip size="small" label="Default" color="success" />}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Created {new Date(c.createdAt).toLocaleString()}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={1}>
                    {!c.isDefault && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={async () => {
                          try {
                            await setDefaultCurrency(c.code)
                            setSnackbar({
                              open: true,
                              message: `"${c.code}" set as default`,
                              severity: 'success',
                            })
                          } catch (error: any) {
                            setSnackbar({
                              open: true,
                              message: error?.message || 'Failed to set default currency',
                              severity: 'error',
                            })
                          }
                        }}
                        disabled={isLoading}
                      >
                        Set Default
                      </Button>
                    )}
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      color="primary"
                      onClick={() => openEdit(c)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      color="error"
                      onClick={() => openDelete(c.code)}
                      disabled={c.isDefault}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {sortedCurrencies.length === 0 && (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No currencies yet. Add one to get started.
                </Typography>
              </Box>
            )}
          </List>
        </Paper>

        <DeleteCurrencyModal
          open={deleteOpen}
          code={codeToDelete}
          onClose={() => {
            if (!isDeleting) setDeleteOpen(false)
          }}
          onDeleted={() => {
            setSnackbar({
              open: true,
              message: 'Currency deleted',
              severity: 'success',
            })
            setCodeToDelete(null)
          }}
          onError={(message) =>
            setSnackbar({
              open: true,
              message,
              severity: 'error',
            })
          }
        />

        <EditCurrencyModal
          open={editOpen}
          currency={currencyToEdit}
          onClose={() => setEditOpen(false)}
          onSaved={(newCode) => {
            setSnackbar({
              open: true,
              message: `Currency updated to "${newCode}"`,
              severity: 'success',
            })
            setCurrencyToEdit(null)
          }}
          onError={(message) =>
            setSnackbar({
              open: true,
              message,
              severity: 'error',
            })
          }
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


