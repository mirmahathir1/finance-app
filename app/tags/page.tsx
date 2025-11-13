'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { PageLayout } from '@/components/PageLayout'
import { Snackbar } from '@/components/Snackbar'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { TagChip } from '@/components/TagChip'
import { EditTagModal } from '@/components/EditTagModal'
import { DeleteTagModal } from '@/components/DeleteTagModal'
import { useTag } from '@/contexts/TagContext'
import { useProfile } from '@/contexts/ProfileContext'
import type { TransactionType, Tag } from '@/types'

export default function TagsPage() {
  const router = useRouter()
  const { activeProfile } = useProfile()
  const { tags, isLoading, addTag, deleteTag, importTagsFromTransactions } = useTag()

  // Create tag form state
  const [newTagName, setNewTagName] = useState('')
  const [newTagType, setNewTagType] = useState<TransactionType>('expense')
  const [newTagColor, setNewTagColor] = useState<string>('#1976d2')
  const [isCreating, setIsCreating] = useState(false)

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Edit state
  const [editOpen, setEditOpen] = useState(false)
  const [tagToEdit, setTagToEdit] = useState<Tag | null>(null)

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  const expenseTags = useMemo(() => tags.filter((t) => t.type === 'expense'), [tags])
  const incomeTags = useMemo(() => tags.filter((t) => t.type === 'income'), [tags])

  const handleImport = async () => {
    try {
      const { added, skipped } = await importTagsFromTransactions()
      setSnackbar({
        open: true,
        message: `Import complete: added ${added}, skipped ${skipped}`,
        severity: 'success',
      })
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.message || 'Failed to import tags',
        severity: 'error',
      })
    }
  }

  const handleCreate = async () => {
    if (!newTagName.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a tag name',
        severity: 'warning',
      })
      return
    }
    try {
      setIsCreating(true)
      await addTag(newTagName.trim(), newTagType, newTagColor)
      setNewTagName('')
      setSnackbar({
        open: true,
        message: 'Tag created',
        severity: 'success',
      })
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.message || 'Failed to create tag',
        severity: 'error',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const openDelete = (tag: Tag) => {
    setTagToDelete(tag)
    setDeleteOpen(true)
  }

  const openEdit = (tag: Tag) => {
    setTagToEdit(tag)
    setEditOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return
    // Deletion now handled by DeleteTagModal
  }

  if (!activeProfile) {
    return (
      <PageLayout>
        <Container maxWidth="lg">
          <Alert severity="warning" sx={{ mt: 4 }}>
            Please select a profile first to manage tags.
          </Alert>
        </Container>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Container maxWidth="md">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Edit Tags</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => router.push('/')}>
              Back to Dashboard
            </Button>
            <Button variant="outlined" onClick={handleImport}>
              Import from Database
            </Button>
          </Box>
        </Box>

        {/* Create Tag Form */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Create Tag
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl sx={{ minWidth: { xs: '100%', sm: 160 } }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={newTagType}
                label="Type"
                onChange={(e) => setNewTagType(e.target.value as TransactionType)}
                disabled={isLoading || isCreating}
              >
                <MenuItem value="expense">Expense</MenuItem>
                <MenuItem value="income">Income</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Tag Name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              fullWidth
              disabled={isLoading || isCreating}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCreate()
                }
              }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="Color"
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                sx={{ width: 80 }}
                disabled={isLoading || isCreating}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              disabled={isLoading || isCreating}
            >
              Add
            </Button>
          </Stack>
        </Paper>

        {/* Expense Tags */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Expense Tags
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {expenseTags.map((tag) => (
              <ListItem key={tag.id} divider>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TagChip tag={tag} size="medium" />
                  <Typography variant="body2" color="text.secondary">
                    {tag.name}
                  </Typography>
                </Stack>
                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit tag (coming next step)">
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        color="primary"
                        onClick={() => openEdit(tag)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      color="error"
                      onClick={() => openDelete(tag)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {expenseTags.length === 0 && (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No expense tags yet.
                </Typography>
              </Box>
            )}
          </List>
        </Paper>

        {/* Income Tags */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Income Tags
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {incomeTags.map((tag) => (
              <ListItem key={tag.id} divider>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TagChip tag={tag} size="medium" />
                  <Typography variant="body2" color="text.secondary">
                    {tag.name}
                  </Typography>
                </Stack>
                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit tag (coming next step)">
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        color="primary"
                        onClick={() => openEdit(tag)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      color="error"
                      onClick={() => openDelete(tag)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {incomeTags.length === 0 && (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No income tags yet.
                </Typography>
              </Box>
            )}
          </List>
        </Paper>

        <DeleteTagModal
          open={deleteOpen}
          tag={tagToDelete}
          onClose={() => {
            if (!isDeleting) setDeleteOpen(false)
          }}
          onDeleted={() => {
            setSnackbar({
              open: true,
              message: 'Tag deleted',
              severity: 'success',
            })
            setTagToDelete(null)
          }}
          onError={(message) =>
            setSnackbar({
              open: true,
              message,
              severity: 'error',
            })
          }
        />

        <EditTagModal
          open={editOpen}
          tag={tagToEdit}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setSnackbar({
              open: true,
              message: 'Tag updated',
              severity: 'success',
            })
            setTagToEdit(null)
          }}
          onError={(message) =>
            setSnackbar({
              open: true,
              message,
              severity: 'error',
            })
          }
        />

        <Snackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </Container>
    </PageLayout>
  )
}


