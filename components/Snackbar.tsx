'use client'

import { Snackbar as MuiSnackbar, Alert, AlertColor } from '@mui/material'

interface SnackbarProps {
  open: boolean
  message: string
  severity?: AlertColor
  onClose: () => void
  autoHideDuration?: number
}

export function Snackbar({
  open,
  message,
  severity = 'info',
  onClose,
  autoHideDuration = 6000,
}: SnackbarProps) {
  return (
    <MuiSnackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </MuiSnackbar>
  )
}

