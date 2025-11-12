'use client'

import { Box, Typography } from '@mui/material'
import { Inbox as InboxIcon } from '@mui/icons-material'

interface EmptyStateProps {
  title?: string
  message?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({
  title = 'No data',
  message = 'There is no data to display.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
      }}
    >
      {icon || (
        <InboxIcon
          sx={{
            fontSize: 64,
            color: 'text.secondary',
            mb: 2,
          }}
        />
      )}
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: action ? 2 : 0 }}>
        {message}
      </Typography>
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  )
}

