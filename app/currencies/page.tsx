'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Collapse,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
  Chip,
  IconButton,
  Skeleton,
} from '@mui/material'
import { TransitionGroup } from 'react-transition-group'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { PageLayout } from '@/components/PageLayout'
import { Snackbar } from '@/components/Snackbar'
import { useCurrency } from '@/contexts/CurrencyContext'
import { EditCurrencyModal } from '@/components/EditCurrencyModal'
import { DeleteCurrencyModal } from '@/components/DeleteCurrencyModal'
import type { Currency } from '@/types'
import { ErrorState } from '@/components/ErrorState'
import { LoadingButton } from '@/components/LoadingButton'

export default function CurrenciesPage() {
  const router = useRouter()
  const {
    currencies,
    defaultCurrency,
    isLoading,
    error,
    addCurrency,
    setDefaultCurrency,
    importCurrenciesFromTransactions,
    refreshCurrencies,
  } = useCurrency()

  // Create form state
  const [newCode, setNewCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

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
    setIsImporting(true)
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
    } finally {
      setIsImporting(false)
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

  const handleRetryCurrencies = () => {
    refreshCurrencies()
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

  return (
    <PageLayout pageName="Currencies" bannerActions={bannerActions}>
      <Container maxWidth="md">
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <LoadingButton
            variant="outlined"
            onClick={handleImport}
            loading={isImporting}
            disabled={isLoading}
          >
            Import from Database
          </LoadingButton>
        </Box>

        {error && (
          <ErrorState
            title="Unable to load currencies"
            message={error}
            onRetry={handleRetryCurrencies}
          />
        )}

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
            <LoadingButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              loading={isCreating}
              disabled={isLoading}
            >
              Add
            </LoadingButton>
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
          {isLoading ? (
            <Box sx={{ py: 2 }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rectangular"
                  height={64}
                  sx={{ borderRadius: 1, mb: index !== 3 ? 2 : 0 }}
                />
              ))}
            </Box>
          ) : (
            <List>
              <TransitionGroup component={null}>
                {sortedCurrencies.map((currency) => (
                  <Collapse key={currency.code}>
                    <ListItem
                      divider
                      sx={{
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: { xs: 1.5, sm: 0 },
                      }}
                    >
                      <ListItemText
                        sx={{ flexGrow: 1, width: '100%' }}
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">{currency.code}</Typography>
                            {currency.isDefault && <Chip size="small" label="Default" color="success" />}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            Created {new Date(currency.createdAt).toLocaleString()}
                          </Typography>
                        }
                      />
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          width: { xs: '100%', sm: 'auto' },
                          justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                          flexWrap: { xs: 'wrap', sm: 'nowrap' },
                          mt: { xs: 1, sm: 0 },
                        }}
                      >
                        {!currency.isDefault && (
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ whiteSpace: 'nowrap' }}
                            onClick={async () => {
                              try {
                                await setDefaultCurrency(currency.code)
                                setSnackbar({
                                  open: true,
                                  message: `"${currency.code}" set as default`,
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
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => openEdit(currency)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          color="error"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => openDelete(currency.code)}
                          disabled={currency.isDefault}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </ListItem>
                  </Collapse>
                ))}
              </TransitionGroup>
              {sortedCurrencies.length === 0 && (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No currencies yet. Add one to get started.
                  </Typography>
                </Box>
              )}
            </List>
          )}
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


