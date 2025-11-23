'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Box,
} from '@mui/material'
import { DialogTransition } from './DialogTransition'
import { standardDialogPaperSx } from './dialogSizing'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      TransitionComponent={DialogTransition}
      keepMounted
      PaperProps={{ sx: standardDialogPaperSx }}
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit" disabled={loading}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmColor}
          variant="contained"
          autoFocus
          disabled={loading}
          sx={{ position: 'relative', minWidth: 100 }}
        >
          {loading && (
            <CircularProgress
              size={20}
              color="inherit"
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                marginTop: '-10px',
                marginLeft: '-10px',
              }}
            />
          )}
          <Box component="span" sx={{ opacity: loading ? 0 : 1 }}>
            {confirmText}
          </Box>
        </Button>
      </DialogActions>
    </Dialog>
  )
}

