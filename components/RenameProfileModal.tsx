'use client'

import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material'
import { useApi } from '@/utils/useApi'
import { useProfile } from '@/contexts/ProfileContext'
import { ConfirmDialog } from './ConfirmDialog'

interface RenameProfileModalProps {
  open: boolean
  profileName: string
  onClose: () => void
  onRenamed?: (newName: string) => void
  onError?: (message: string) => void
}

export function RenameProfileModal({
  open,
  profileName,
  onClose,
  onRenamed,
  onError,
}: RenameProfileModalProps) {
  const api = useApi()
  const { renameProfile } = useProfile()

  const [newName, setNewName] = useState(profileName)
  const [affectedCount, setAffectedCount] = useState<number | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setNewName(profileName)
      setInputError(null)
      // Load preview
      const loadPreview = async () => {
        try {
          setIsLoadingPreview(true)
          const response = await api.previewProfileRename(profileName)
          if (response.success) {
            setAffectedCount(response.data?.affectedCount ?? 0)
          } else {
            setAffectedCount(0)
          }
        } catch (e) {
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

  const validate = (): boolean => {
    if (!newName.trim()) {
      setInputError('Profile name cannot be empty')
      return false
    }
    if (newName.trim() === profileName) {
      setInputError('New name must be different from current name')
      return false
    }
    setInputError(null)
    return true
  }

  const performRename = async () => {
    try {
      setIsSaving(true)
      await renameProfile(profileName, newName.trim())
      onRenamed?.(newName.trim())
      onClose()
    } catch (error: any) {
      const message = error?.message || 'Failed to rename profile'
      onError?.(message)
      setInputError(message)
    } finally {
      setIsSaving(false)
      setConfirmOpen(false)
    }
  }

  const handleSave = () => {
    if (!validate()) return
    if ((affectedCount ?? 0) > 0) {
      setConfirmOpen(true)
    } else {
      performRename()
    }
  }

  return (
    <>
      <Dialog open={open} onClose={() => !isSaving && onClose()}>
        <DialogTitle>Rename Profile</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Current name: <strong>{profileName}</strong>
          </Typography>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="New Profile Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={isSaving}
            error={Boolean(inputError)}
            helperText={inputError || ' '}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSave()
              }
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            {isLoadingPreview ? (
              <>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  Loading affected transactions...
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color="text.secondary">
                {(affectedCount ?? 0) > 0
                  ? `${affectedCount} transaction(s) will be updated`
                  : 'No transactions will be affected'}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={isSaving}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Rename"
        message={`Renaming "${profileName}" to "${newName.trim()}" will update ${affectedCount} transaction(s). Proceed?`}
        confirmText="Rename"
        cancelText="Cancel"
        confirmColor="primary"
        onConfirm={performRename}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}


