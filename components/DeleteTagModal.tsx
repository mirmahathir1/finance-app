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
import type { Tag } from '@/types'
import { useApi } from '@/utils/useApi'
import { useProfile } from '@/contexts/ProfileContext'
import { useTag } from '@/contexts/TagContext'

interface DeleteTagModalProps {
  open: boolean
  tag: Tag | null
  onClose: () => void
  onDeleted?: () => void
  onError?: (message: string) => void
}

export function DeleteTagModal({
  open,
  tag,
  onClose,
  onDeleted,
  onError,
}: DeleteTagModalProps) {
  const api = useApi()
  const { activeProfile } = useProfile()
  const { deleteTag } = useTag()

  const [affectedCount, setAffectedCount] = useState<number | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (open && tag && activeProfile) {
      const loadPreview = async () => {
        try {
          setIsLoadingPreview(true)
          const response = await api.previewTagDelete(tag.name, activeProfile)
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
  }, [open, tag?.id, activeProfile])

  const handleDelete = async () => {
    if (!tag) return
    try {
      setIsDeleting(true)
      await deleteTag(tag.id)
      onDeleted?.()
      onClose()
    } catch (error: any) {
      const message = error?.message || 'Failed to delete tag'
      onError?.(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const deletionBlocked = (affectedCount ?? 0) > 0

  return (
    <Dialog open={open} onClose={() => !isDeleting && onClose()}>
      <DialogTitle>Delete Tag</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Tag: <strong>{tag?.name}</strong>
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
            Cannot delete this tag. It is used in {affectedCount} transaction(s).
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mt: 1 }}>
            This action cannot be undone. The tag will be permanently deleted.
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


