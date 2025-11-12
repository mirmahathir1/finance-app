'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { PageLayout } from '@/components/PageLayout'
import { Snackbar } from '@/components/Snackbar'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useProfile } from '@/contexts/ProfileContext'
import { RenameProfileModal } from '@/components/RenameProfileModal'
import { DeleteProfileModal } from '@/components/DeleteProfileModal'

export default function ProfilesPage() {
  const router = useRouter()
  const {
    profiles,
    activeProfile,
    isLoading,
    addProfile,
    renameProfile,
    deleteProfile,
    switchProfile,
    importProfilesFromTransactions,
  } = useProfile()

  // Create form state
  const [newProfileName, setNewProfileName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Rename dialog state
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameOldName, setRenameOldName] = useState<string | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteName, setDeleteName] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({
    open: false,
    message: '',
    severity: 'info',
  })

  const handleImport = async () => {
    try {
      const { added, skipped } = await importProfilesFromTransactions()
      setSnackbar({
        open: true,
        message: `Import complete: added ${added}, skipped ${skipped}`,
        severity: 'success',
      })
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.message || 'Failed to import profiles',
        severity: 'error',
      })
    }
  }

  const handleCreate = async () => {
    if (!newProfileName.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a profile name',
        severity: 'warning',
      })
      return
    }
    try {
      setIsCreating(true)
      await addProfile(newProfileName.trim())
      setNewProfileName('')
      setSnackbar({
        open: true,
        message: 'Profile created',
        severity: 'success',
      })
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.message || 'Failed to create profile',
        severity: 'error',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const openRename = (name: string) => {
    setRenameOldName(name)
    setRenameOpen(true)
  }

  const openDelete = (name: string) => {
    setDeleteName(name)
    setDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteName) return
    // Deletion now handled by DeleteProfileModal
  }

  return (
    <PageLayout>
      <Container maxWidth="md">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Manage Profiles</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => router.push('/')}>
              Back to Dashboard
            </Button>
            <Button variant="outlined" onClick={handleImport}>
              Import from Database
            </Button>
          </Box>
        </Box>

        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Create Profile
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Profile Name"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              fullWidth
              disabled={isLoading || isCreating}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCreate()
                }
              }}
            />
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

        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Profiles</Typography>
            {activeProfile && (
              <Typography variant="body2" color="text.secondary">
                Active: <strong>{activeProfile}</strong>
              </Typography>
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            {profiles.map((p) => (
              <ListItem key={p.name} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">{p.name}</Typography>
                      {p.name === activeProfile && (
                        <Chip size="small" label="Active" color="success" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Created {new Date(p.createdAt).toLocaleString()}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={1}>
                    {p.name !== activeProfile && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={async () => {
                          try {
                            await switchProfile(p.name)
                            setSnackbar({
                              open: true,
                              message: `Switched to "${p.name}"`,
                              severity: 'success',
                            })
                          } catch (error: any) {
                            setSnackbar({
                              open: true,
                              message: error?.message || 'Failed to switch profile',
                              severity: 'error',
                            })
                          }
                        }}
                        disabled={isLoading}
                      >
                        Set Active
                      </Button>
                    )}
                    <IconButton
                      edge="end"
                      aria-label="rename"
                      onClick={() => openRename(p.name)}
                      disabled={isLoading}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => openDelete(p.name)}
                      disabled={isLoading || p.name === activeProfile}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {profiles.length === 0 && (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No profiles found. Create your first profile to get started.
                </Typography>
              </Box>
            )}
          </List>
        </Paper>

        <RenameProfileModal
          open={renameOpen}
          profileName={renameOldName || ''}
          onClose={() => setRenameOpen(false)}
          onRenamed={(newName) => {
            setSnackbar({
              open: true,
              message: `Profile renamed to "${newName}"`,
              severity: 'success',
            })
            setRenameOldName(null)
          }}
          onError={(message) =>
            setSnackbar({
              open: true,
              message,
              severity: 'error',
            })
          }
        />

        <DeleteProfileModal
          open={deleteOpen}
          profileName={deleteName || ''}
          onClose={() => {
            if (!isDeleting) setDeleteOpen(false)
          }}
          onDeleted={() => {
            setSnackbar({
              open: true,
              message: 'Profile deleted',
              severity: 'success',
            })
            setDeleteName(null)
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


