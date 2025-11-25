'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
} from '@mui/material'
import { formatAmount } from '@/utils/amount'
import { format, parseISO } from 'date-fns'
import type { Transaction } from '@/types'
import { standardDialogPaperSx } from './dialogSizing'

interface DeleteTransactionModalProps {
  open: boolean
  transaction: Transaction | null
  onConfirm: () => void
  onCancel: () => void
  isDeleting?: boolean
}

export function DeleteTransactionModal({
  open,
  transaction,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteTransactionModalProps) {
  if (!transaction) return null

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{ sx: standardDialogPaperSx }}
    >
      <DialogTitle sx={{ textAlign: 'center' }}>Delete Transaction</DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph sx={{ textAlign: 'center' }}>
          Are you sure you want to delete this transaction? This action cannot be undone.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ textAlign: 'center' }}>
            Transaction Details
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Date:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {format(parseISO(transaction.occurredAt), 'MMM d, yyyy')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Type:
              </Typography>
              <Chip
                label={transaction.type === 'expense' ? 'Expense' : 'Income'}
                size="small"
                color={transaction.type === 'expense' ? 'error' : 'success'}
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Amount:
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Currency:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {transaction.currency}
              </Typography>
            </Box>

            {transaction.note && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ textAlign: 'center' }}>
                  Description:
                </Typography>
                <Typography variant="body2" sx={{ textAlign: 'center' }}>{transaction.note}</Typography>
              </Box>
            )}

            {transaction.tags.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ textAlign: 'center' }}>
                  Tags:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5, justifyContent: 'center' }}>
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
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center' }}>
        <Button onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

