'use client'

import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useApi } from '@/utils/useApi'
import { standardDialogPaperSx } from './dialogSizing'

interface DeleteCurrencyModalProps {
  open: boolean
  code: string | null
  onClose: () => void
  onDeleted?: () => void
  onError?: (message: string) => void
}

export function DeleteCurrencyModal({
  open,
  code,
  onClose,
  onDeleted,
  onError,
}: DeleteCurrencyModalProps) {
  const api = useApi()
  const { deleteCurrency } = useCurrency()

  const [affectedCount, setAffectedCount] = useState<number | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (open && code) {
      const loadPreview = async () => {
        try {
          setIsLoadingPreview(true)
          const response = await api.getTransactions({})
          if (response.success && response.data) {
            const transactions = response.data.transactions || []
            const count = transactions.filter((t) => t.currency === code).length
            setAffectedCount(count)
          } else {
            setAffectedCount(0)
          }
        } catch {
          setAffectedCount(0)
        } finally {
          setIsLoadingPreview(false)
        }
      }
      loadPreview()
    } else {
      setAffectedCount(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, code])

  const handleDelete = async () => {
    if (!code) return
    try {
      setIsDeleting(true)
      const canSkipUsageCheck = affectedCount !== null && affectedCount === 0
      await deleteCurrency(code, { skipUsageCheck: canSkipUsageCheck })
      onDeleted?.()
      onClose()
    } catch (error: any) {
      const message = error?.message || 'Failed to delete currency'
      onError?.(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const deletionBlocked = (affectedCount ?? 0) > 0

  return (
    <Dialog
      open={open}
      onClose={() => !isDeleting && onClose()}
      PaperProps={{ sx: standardDialogPaperSx }}
    >
      <DialogTitle>Delete Currency</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Currency: <strong>{code}</strong>
        </Typography>
        {isLoadingPreview ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Checking usage...
            </Typography>
          </Box>
        ) : deletionBlocked ? (
          <Alert severity="error" sx={{ mt: 1 }}>
            Cannot delete this currency. It is used in {affectedCount} transaction(s).
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mt: 1 }}>
            This action cannot be undone. The currency will be permanently deleted.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={isDeleting || deletionBlocked || isLoadingPreview}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}


