'use client'

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { format, parseISO } from 'date-fns'
import { TagChip } from '@/components/TagChip'
import { formatAmount } from '@/utils/amount'
import type { Tag, Transaction } from '@/types'

interface StatisticsTransactionsTableProps {
  transactions: Transaction[]
  tags: Tag[]
  onTransactionClick: (transactionId: string) => void
}

export function StatisticsTransactionsTable({
  transactions,
  tags,
  onTransactionClick,
}: StatisticsTransactionsTableProps) {
  return (
    <TableContainer>
      <Table size="small" sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Tags</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Currency</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow
              key={transaction.id}
              hover
              onClick={() => onTransactionClick(transaction.id)}
              sx={{ cursor: 'pointer' }}
            >
              <TableCell>
                {format(parseISO(transaction.occurredAt), 'MMM d, yyyy')}
              </TableCell>
              <TableCell sx={{ textTransform: 'capitalize' }}>
                {transaction.type}
              </TableCell>
              <TableCell>
                {transaction.note || <em>No description</em>}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {transaction.tags.map((tagName) => {
                    const tag = tags.find((item) => item.name === tagName)
                    return tag ? (
                      <TagChip key={tag.id} tag={tag} size="small" />
                    ) : (
                      <Box
                        key={`${transaction.id}-${tagName}`}
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: 10,
                          border: '1px solid',
                          borderColor: 'divider',
                          fontSize: 12,
                        }}
                      >
                        {tagName}
                      </Box>
                    )
                  })}
                </Box>
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: transaction.type === 'expense' ? 'error.main' : 'success.main',
                  fontWeight: 700,
                }}
              >
                {transaction.type === 'expense' ? '-' : '+'}
                {formatAmount(
                  transaction.displayAmountMinor ?? transaction.amountMinor,
                  transaction.displayCurrency ?? transaction.currency
                )}
              </TableCell>
              <TableCell>
                {transaction.displayCurrency ?? transaction.currency}
                {transaction.displayWasConverted ? ' (converted)' : ''}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
