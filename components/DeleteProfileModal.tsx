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
import { useApi } from '@/utils/useApi'
import { useProfile } from '@/contexts/ProfileContext'

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
          const response = await api.previewProfileDelete(profileName)
          if (response.success) {
            setAffectedCount(response.data?.affectedCount ?? 0)
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
      await deleteProfile(profileName)
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
    <Dialog open={open} onClose={() => !isDeleting && onClose()}>
      <DialogTitle>Delete Profile</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Profile: <strong>{profileName}</strong>
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
            Cannot delete this profile. It is used in {affectedCount} transaction(s).
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mt: 1 }}>
            This action cannot be undone. The profile will be permanently deleted.
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


