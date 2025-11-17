'use client'

import { useMemo, useState } from 'react'
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
  IconButton,
  Divider,
  Skeleton,
  Collapse,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { TransitionGroup } from 'react-transition-group'
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
import { ErrorState } from '@/components/ErrorState'
import { LoadingButton } from '@/components/LoadingButton'
import { AnimatedSection } from '@/components/AnimatedSection'
import type { Profile } from '@/types'
import { usePrefersReducedMotion, getMotionDuration } from '@/utils/motion'

export default function ProfilesPage() {
  const router = useRouter()
  const theme = useTheme()
  const prefersReducedMotion = usePrefersReducedMotion()
  const {
    profiles,
    activeProfile,
    isLoading,
    error,
    addProfile,
    renameProfile,
    deleteProfile,
    switchProfile,
    importProfilesFromTransactions,
    refreshProfiles,
  } = useProfile()

  // Create form state
  const [newProfileName, setNewProfileName] = useState('')
  const [isImporting, setIsImporting] = useState(false)

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

  const collapseDurations = useMemo(
    () => ({
      enter: getMotionDuration(prefersReducedMotion, theme.transitions.duration.enteringScreen),
      exit: getMotionDuration(prefersReducedMotion, theme.transitions.duration.leavingScreen),
    }),
    [
      prefersReducedMotion,
      theme.transitions.duration.enteringScreen,
      theme.transitions.duration.leavingScreen,
    ]
  )

  const renderProfileListItem = (p: Profile) => (
    <ListItem
      divider
      sx={{
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: { xs: 1.5, sm: 0 },
      }}
    >
      <ListItemText
        sx={{ flexGrow: 1, width: '100%' }}
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1">{p.name}</Typography>
            {p.name === activeProfile && <Chip size="small" label="Active" color="success" />}
          </Box>
        }
        secondary={
          <Typography variant="caption" color="text.secondary">
            Created {new Date(p.createdAt).toLocaleString()}
          </Typography>
        }
      />
      <Stack
        direction="row"
        spacing={1}
        sx={{
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'flex-start', sm: 'flex-end' },
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          mt: { xs: 1, sm: 0 },
        }}
      >
        {p.name !== activeProfile && (
          <Button
            size="small"
            variant="outlined"
            sx={{ whiteSpace: 'nowrap' }}
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
    </ListItem>
  )

  const handleImport = async () => {
    setIsImporting(true)
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
    } finally {
      setIsImporting(false)
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

  const handleRetryProfiles = () => {
    refreshProfiles()
  }

  return (
    <PageLayout>
      <Container maxWidth="md">
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography variant="h4">Manage Profiles</Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            }}
          >
            <Button variant="outlined" onClick={() => router.push('/')}>
              Back to Dashboard
            </Button>
            <LoadingButton
              variant="outlined"
              onClick={handleImport}
              loading={isImporting}
              disabled={isLoading}
            >
              Import from Database
            </LoadingButton>
          </Box>
        </Box>

        {error && (
          <ErrorState
            title="Unable to load profiles"
            message={error}
            onRetry={handleRetryProfiles}
          />
        )}

        <AnimatedSection>
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
                disabled={isLoading}
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
                disabled={isLoading}
              >
                Add
              </Button>
            </Stack>
          </Paper>
        </AnimatedSection>

        <AnimatedSection delay={80}>
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
          {isLoading && profiles.length === 0 ? (
            <Box sx={{ py: 2 }}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rectangular"
                  height={64}
                  sx={{ borderRadius: 1, mb: index !== 2 ? 2 : 0 }}
                />
              ))}
            </Box>
          ) : (
            <List>
              {prefersReducedMotion ? (
                profiles.map((p) => (
                  <Box key={p.name} sx={{ width: '100%' }}>
                    {renderProfileListItem(p)}
                  </Box>
                ))
              ) : (
                <TransitionGroup component={null}>
                  {profiles.map((p) => (
                    <Collapse
                      key={p.name}
                      timeout={collapseDurations}
                      appear
                      unmountOnExit
                      sx={{ width: '100%' }}
                    >
                      {renderProfileListItem(p)}
                    </Collapse>
                  ))}
                </TransitionGroup>
              )}
              {profiles.length === 0 && (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No profiles found. Create your first profile to get started.
                  </Typography>
                </Box>
              )}
            </List>
          )}
          </Paper>
        </AnimatedSection>

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


