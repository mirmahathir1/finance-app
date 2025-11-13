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
  const { tags, updateTag, renameTag } = useTag()
  const { activeProfile } = useProfile()

  const [name, setName] = useState(tag?.name ?? '')
  const [type, setType] = useState<TransactionType>(tag?.type ?? 'expense')
  const [color, setColor] = useState<string>(tag?.color ?? '#1976d2')

  const [affectedCount, setAffectedCount] = useState<number | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)

  const originalName = tag?.name ?? ''
  const originalType = tag?.type ?? 'expense'
  const originalColor = tag?.color ?? '#1976d2'

  const hasNameChanged = useMemo(
    () => name.trim() !== '' && name.trim() !== originalName,
    [name, originalName]
  )
  const hasTypeChanged = useMemo(() => type !== originalType, [type, originalType])
  const hasColorChanged = useMemo(
    () => (color || '') !== (originalColor || ''),
    [color, originalColor]
  )

  useEffect(() => {
    if (open && tag) {
      setName(tag.name)
      setType(tag.type)
      setColor(tag.color || '#1976d2')
      setInputError(null)
      // Load preview for rename (affected transactions) once
      const loadPreview = async () => {
        try {
          setIsLoadingPreview(true)
          const response = await api.previewTagRename(tag.name, activeProfile || '')
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
  }, [open, tag?.id])

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

      const updates: Partial<Tag> = {}
      if (hasTypeChanged) updates.type = type
      if (hasColorChanged) updates.color = color

      if (Object.keys(updates).length > 0) {
        await updateTag(tag.id, updates)
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
    if (hasNameChanged && (affectedCount ?? 0) > 0) {
      setConfirmOpen(true)
    } else {
      performSave()
    }
  }

  return (
    <>
      <Dialog open={open} onClose={() => !isSaving && onClose()}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                label="Color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                sx={{ width: 100 }}
                disabled={isSaving}
                InputLabelProps={{ shrink: true }}
              />
              <Typography variant="caption" color="text.secondary">
                Choose a color to display for this tag
              </Typography>
            </Box>

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
                  {hasNameChanged
                    ? (affectedCount ?? 0) > 0
                      ? `${affectedCount} transaction(s) will be updated if you rename this tag`
                      : 'No transactions will be affected by renaming'
                    : 'No rename pending'}
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
        title="Confirm Tag Rename"
        message={`Renaming "${originalName}" to "${name.trim()}" will update ${affectedCount} transaction(s). Proceed?`}
        confirmText="Rename"
        cancelText="Cancel"
        confirmColor="primary"
        onConfirm={performSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}


