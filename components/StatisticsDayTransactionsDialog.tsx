'use client'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import { format, parseISO } from 'date-fns'
import { DialogTransition } from '@/components/DialogTransition'
import { StatisticsTransactionsTable } from '@/components/StatisticsTransactionsTable'
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
      maxWidth="md"
      TransitionComponent={DialogTransition}
      PaperProps={{ sx: { maxWidth: 960 } }}
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
          <StatisticsTransactionsTable
            transactions={transactions}
            tags={tags}
            onTransactionClick={onTransactionClick}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
