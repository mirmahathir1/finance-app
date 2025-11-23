'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material'
import type { Tag, TransactionType } from '@/types'
import { useTag } from '@/contexts/TagContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useApi } from '@/utils/useApi'
import { ConfirmDialog } from './ConfirmDialog'
import { standardDialogPaperSx } from './dialogSizing'

interface EditTagModalProps {
  open: boolean
  tag: Tag | null
  onClose: () => void
  onSaved?: () => void
  onError?: (message: string) => void
}

export function EditTagModal({
  open,
  tag,
  onClose,
  onSaved,
  onError,
}: EditTagModalProps) {
  const api = useApi()
  const { tags, updateTag, renameTag, changeTagType } = useTag()
  const { activeProfile } = useProfile()

  const [name, setName] = useState(tag?.name ?? '')
  const [type, setType] = useState<TransactionType>(tag?.type ?? 'expense')

  const [affectedCount, setAffectedCount] = useState<number | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)

  const originalName = tag?.name ?? ''
  const originalType = tag?.type ?? 'expense'

  const hasNameChanged = useMemo(
    () => name.trim() !== '' && name.trim() !== originalName,
    [name, originalName]
  )
  const hasTypeChanged = useMemo(() => type !== originalType, [type, originalType])

  useEffect(() => {
    if (open && tag) {
      setName(tag.name)
      setType(tag.type)
      setInputError(null)
    } else {
      setAffectedCount(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tag?.id])

  useEffect(() => {
    if (open && tag && activeProfile) {
      const loadPreview = async () => {
        try {
          setIsLoadingPreview(true)
          const response = await api.getTransactions({
            profile: activeProfile,
            tag: tag.name,
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tag?.id, tag?.name, activeProfile])

  const validate = (): boolean => {
    const trimmed = name.trim()
    if (!trimmed) {
      setInputError('Tag name cannot be empty')
      return false
    }
    // If name unchanged but type changed, ensure no duplicate on target type
    if (!hasNameChanged && hasTypeChanged) {
      const duplicate = tags.find(
        (t) => t.id !== tag?.id && t.name === trimmed && t.type === type
      )
      if (duplicate) {
        setInputError(`A tag with this name already exists for ${type} transactions`)
        return false
      }
    }
    // If name changed, TagContext.renameTag will handle duplicate validation for that type
    setInputError(null)
    return true
  }

  const performSave = async () => {
    if (!tag) return
    try {
      setIsSaving(true)
      const trimmed = name.trim()

      if (hasNameChanged) {
        await renameTag(tag.id, trimmed)
      }

      if (hasTypeChanged) {
        await changeTagType(tag.id, type)
      }

      onSaved?.()
      onClose()
    } catch (error: any) {
      const message = error?.message || 'Failed to save tag'
      setInputError(message)
      onError?.(message)
    } finally {
      setIsSaving(false)
      setConfirmOpen(false)
    }
  }

  const handleSave = () => {
    if (!validate()) return
    const needsConfirmation = (hasNameChanged || hasTypeChanged) && (affectedCount ?? 0) > 0
    if (needsConfirmation) {
      setConfirmOpen(true)
    } else {
      performSave()
    }
  }

  return (
    <>
      <Dialog
        open={open && !confirmOpen}
        onClose={() => !isSaving && onClose()}
        PaperProps={{ sx: standardDialogPaperSx }}
      >
        <DialogTitle>Edit Tag</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Tag Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
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
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={type}
                label="Type"
                onChange={(e) => setType(e.target.value as TransactionType)}
                disabled={isSaving}
              >
                <MenuItem value="expense">Expense</MenuItem>
                <MenuItem value="income">Income</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isLoadingPreview ? (
                <>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">
                    Checking affected transactions...
                  </Typography>
                </>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  {hasNameChanged && hasTypeChanged
                    ? (affectedCount ?? 0) > 0
                      ? `${affectedCount} transaction(s) will be updated if you rename and change the type of this tag`
                      : 'No transactions will be affected'
                    : hasNameChanged
                    ? (affectedCount ?? 0) > 0
                      ? `${affectedCount} transaction(s) will be updated if you rename this tag`
                      : 'No transactions will be affected by renaming'
                    : hasTypeChanged
                    ? (affectedCount ?? 0) > 0
                      ? `${affectedCount} transaction(s) will be updated if you change the type of this tag`
                      : 'No transactions will be affected by changing the type'
                    : (affectedCount ?? 0) > 0
                    ? `${affectedCount} transaction(s) use this tag`
                    : 'No transactions use this tag'}
                </Typography>
              )}
            </Box>
          </Stack>
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
        title={hasNameChanged && hasTypeChanged ? "Confirm Tag Changes" : hasNameChanged ? "Confirm Tag Rename" : "Confirm Tag Type Change"}
        message={
          hasNameChanged && hasTypeChanged
            ? `Renaming "${originalName}" to "${name.trim()}" and changing type from ${originalType} to ${type} will update ${affectedCount} transaction(s). Proceed?`
            : hasNameChanged
            ? `Renaming "${originalName}" to "${name.trim()}" will update ${affectedCount} transaction(s). Proceed?`
            : `Changing tag type from ${originalType} to ${type} will update ${affectedCount} transaction(s). Proceed?`
        }
        confirmText={hasNameChanged && hasTypeChanged ? "Save Changes" : hasNameChanged ? "Rename" : "Change Type"}
        cancelText="Cancel"
        confirmColor="primary"
        loading={isSaving}
        onConfirm={performSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}


