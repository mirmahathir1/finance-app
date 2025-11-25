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
import { DialogTransition } from './DialogTransition'
import { standardDialogPaperSx } from './dialogSizing'

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
      <Dialog
        open={open}
        onClose={() => !isSaving && onClose()}
        TransitionComponent={DialogTransition}
        keepMounted
        PaperProps={{ sx: standardDialogPaperSx }}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>Rename Profile</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, justifyContent: 'center', width: '100%' }}>
            {isLoadingPreview ? (
              <>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Loading affected transactions...
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                {(affectedCount ?? 0) > 0
                  ? `${affectedCount} transaction(s) will be updated`
                  : 'No transactions will be affected'}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isSaving}
            sx={{ position: 'relative', minWidth: 100 }}
          >
            {isSaving && (
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
            <Box component="span" sx={{ opacity: isSaving ? 0 : 1 }}>
              Save
            </Box>
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
        loading={isSaving}
        onConfirm={performRename}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}


