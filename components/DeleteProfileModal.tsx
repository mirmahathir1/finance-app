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
  Fade,
} from '@mui/material'
import { useApi } from '@/utils/useApi'
import { useProfile } from '@/contexts/ProfileContext'
import { DialogTransition } from './DialogTransition'
import { standardDialogPaperSx } from './dialogSizing'

interface DeleteProfileModalProps {
  open: boolean
  profileName: string
  onClose: () => void
  onDeleted?: () => void
  onError?: (message: string) => void
}

export function DeleteProfileModal({
  open,
  profileName,
  onClose,
  onDeleted,
  onError,
}: DeleteProfileModalProps) {
  const api = useApi()
  const { deleteProfile } = useProfile()

  const [affectedCount, setAffectedCount] = useState<number | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (open) {
      const loadPreview = async () => {
        try {
          setIsLoadingPreview(true)
          const response = await api.getTransactions({
            profile: profileName,
            limit: 1,
            offset: 0,
          })
          if (response.success && response.data) {
            setAffectedCount(
              response.data.pagination?.total ??
                response.data.transactions?.length ??
                0
            )
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
  }, [open, profileName])

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteProfile(profileName, { affectedCount })
      onDeleted?.()
      onClose()
    } catch (error: any) {
      const message = error?.message || 'Failed to delete profile'
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
      TransitionComponent={DialogTransition}
      keepMounted
      PaperProps={{ sx: standardDialogPaperSx }}
    >
      <DialogTitle sx={{ textAlign: 'center' }}>Delete Profile</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
          Profile: <strong>{profileName}</strong>
        </Typography>
        <Box
          sx={{
            minHeight: 120,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isLoadingPreview ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                Checking usage...
              </Typography>
            </Box>
          ) : deletionBlocked ? (
            <Alert severity="error" sx={{ width: '100%', textAlign: 'center' }}>
              Cannot delete this profile. It is used in {affectedCount} transaction(s).
            </Alert>
          ) : (
            <Fade in timeout={300} appear mountOnEnter unmountOnExit>
              <Alert severity="warning" sx={{ width: '100%', textAlign: 'center' }}>
                This action cannot be undone. The profile will be permanently deleted.
              </Alert>
            </Fade>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center' }}>
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


