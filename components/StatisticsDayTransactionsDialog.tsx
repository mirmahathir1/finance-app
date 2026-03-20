'use client'

import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { format, parseISO } from 'date-fns'
import { DialogTransition } from '@/components/DialogTransition'
import { formatAmount } from '@/utils/amount'
import type { Tag, Transaction, TransactionType } from '@/types'

interface StatisticsDayTransactionsDialogProps {
  open: boolean
  date: string | null
  type: TransactionType | null
  transactions: Transaction[]
  tags: Tag[]
  isLoading?: boolean
  onClose: () => void
  onTransactionClick: (transactionId: string) => void
}

export function StatisticsDayTransactionsDialog({
  open,
  date,
  type,
  transactions,
  tags,
  isLoading = false,
  onClose,
  onTransactionClick,
}: StatisticsDayTransactionsDialogProps) {
  const titleLabel = type === 'income' ? 'Income' : 'Expense'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      TransitionComponent={DialogTransition}
      PaperProps={{ sx: { maxWidth: 640 } }}
    >
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {titleLabel} Transactions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {date ? format(parseISO(date), 'EEEE, MMM d, yyyy') : 'Selected date'}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {isLoading ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            Loading transactions...
          </Typography>
        ) : transactions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No matching transactions for this event.
          </Typography>
        ) : (
          <List disablePadding>
            {transactions.map((transaction, index) => {
              const transactionTags = transaction.tags
                .map((tagName) => tags.find((tag) => tag.name === tagName)?.name || tagName)

              return (
                <Box key={transaction.id}>
                  {index > 0 && <Divider component="div" />}
                  <ListItemButton
                    alignItems="flex-start"
                    onClick={() => onTransactionClick(transaction.id)}
                    sx={{ px: 0, py: 1.5 }}
                  >
                    <ListItemText
                      disableTypography
                      primary={
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          spacing={2}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {transaction.note || 'No description'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(parseISO(transaction.occurredAt), 'MMM d, yyyy')}
                            </Typography>
                          </Box>
                          <Typography
                            variant="subtitle2"
                            color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                            sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                          >
                            {transaction.type === 'expense' ? '-' : '+'}
                            {formatAmount(
                              transaction.displayAmountMinor ?? transaction.amountMinor,
                              transaction.displayCurrency ?? transaction.currency
                            )}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {transactionTags.map((tagName) => (
                              <Chip key={`${transaction.id}-${tagName}`} label={tagName} size="small" />
                            ))}
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {transaction.displayCurrency ?? transaction.currency}
                            {transaction.displayWasConverted ? ' (converted)' : ''}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItemButton>
                </Box>
              )
            })}
          </List>
        )}
      </DialogContent>
    </Dialog>
  )
}
