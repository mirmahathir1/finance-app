'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Alert,
} from '@mui/material'
import { PageLayout } from '@/components/PageLayout'
import { Snackbar } from '@/components/Snackbar'
import { useProfile } from '@/contexts/ProfileContext'
import { useApi } from '@/utils/useApi'
import { useLoading } from '@/contexts/LoadingContext'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material'
import { guestDataService } from '@/services/guestDataService'
import { LoadingButton } from '@/components/LoadingButton'
import { standardDialogPaperSx } from '@/components/dialogSizing'
import { useAuth } from '@/contexts/AuthContext'

export default function BackupRestorePage() {
  const router = useRouter()
  const { activeProfile } = useProfile()
  const api = useApi()
  const { startLoading, stopLoading } = useLoading()
  const { isGuestMode } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  const [isDownloading, setIsDownloading] = useState(false)
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false)
  const [confirmTypeOpen, setConfirmTypeOpen] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')
  const requiredConfirmText = 'finance-app'
  const [isRestoring, setIsRestoring] = useState(false)

  const handleDownloadClick = async () => {
    try {
      setIsDownloading(true)
      if (isGuestMode) {
        const response = await api.apiCall<{ csv: string }>('/api/backup')
        if ('success' in response && response.success && response.data?.csv) {
          const csv = response.data.csv
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          const dateStr = new Date().toISOString().slice(0, 10)
          const profileSuffix = activeProfile ? `-${activeProfile}` : ''
          a.href = url
          a.download = `finance-backup${profileSuffix}-${dateStr}.csv`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          setSnackbar({
            open: true,
            message: 'Backup downloaded successfully',
            severity: 'success',
          })
        } else {
          const message =
            ('error' in response && response.error.message) ||
            'Failed to generate backup'
          setSnackbar({
            open: true,
            message,
            severity: 'error',
          })
        }
        return
      }

      const response = await fetch('/api/backup', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        throw new Error(errorPayload?.error?.message || 'Failed to generate backup')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dateStr = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `finance-backup-${dateStr}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setSnackbar({
        open: true,
        message: 'Backup downloaded successfully',
        severity: 'success',
      })
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.message || 'Failed to generate backup',
        severity: 'error',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleRestoreClick = () => {
    // Trigger hidden file input (CSV)
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRestoreFile(file)
    setConfirmRestoreOpen(true)
    // Clear the input value so the same file can be re-selected later
    e.currentTarget.value = ''
  }

  const proceedToTypeToConfirm = () => {
    setConfirmRestoreOpen(false)
    setConfirmTypeOpen(true)
  }

  const performRestore = async () => {
    if (!restoreFile) return
    try {
      setIsRestoring(true)
      startLoading()
      if (isGuestMode) {
        const text = await restoreFile.text()
        const { imported } = guestDataService.importTransactionsFromCSV(text)
        setSnackbar({
          open: true,
          message: `Restore complete: imported ${imported} transaction(s).`,
          severity: 'success',
        })
      } else {
        const formData = new FormData()
        formData.append('file', restoreFile, restoreFile.name || 'backup.csv')

        const response = await fetch('/api/restore', {
          method: 'POST',
          body: formData,
          headers: {
            'x-restore-confirm': requiredConfirmText,
          },
          credentials: 'include',
        })

        const payload = await response.json().catch(() => null)
        if (!response.ok || !payload?.success) {
          const message =
            payload?.error?.message || payload?.message || 'Failed to restore from CSV'
          throw new Error(message)
        }

        const restoredSummary = payload.data?.restored ?? {}
        const restoredCount = restoredSummary.transactionCount ?? 0
        const deletedCount = restoredSummary.deletedCount ?? 0

        setSnackbar({
          open: true,
          message: `Restore complete: imported ${restoredCount} transaction(s), replaced ${deletedCount}.`,
          severity: 'success',
        })
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.message || 'Failed to restore from CSV',
        severity: 'error',
      })
    } finally {
      stopLoading()
      setIsRestoring(false)
      setConfirmTypeOpen(false)
      setConfirmInput('')
      setRestoreFile(null)
    }
  }

  const bannerActions = (
    <Button
      variant="outlined"
      color="inherit"
      onClick={() => router.push('/')}
      sx={{
        borderColor: 'rgba(255,255,255,0.8)',
        color: 'inherit',
        '&:hover': {
          borderColor: 'primary.contrastText',
          backgroundColor: 'rgba(255,255,255,0.15)',
        },
      }}
    >
      Back to Dashboard
    </Button>
  )

  return (
    <PageLayout pageName="Backup & Restore" bannerActions={bannerActions}>
      <Container maxWidth="md">

        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Stack spacing={2}>
            <Typography variant="body1">
              Active Profile: <strong>{activeProfile || 'None selected'}</strong>
            </Typography>
            <Alert severity="info">
              {isGuestMode
                ? (
                  <>
                    This backup includes the mock transactions stored for the demo experience. Identifiers such as <code>id</code> and <code>user_id</code> are excluded from the CSV.
                  </>
                )
                : (
                  <>
                    This backup includes every transaction in your account. Identifiers such as <code>id</code> and <code>user_id</code> are excluded from the CSV.
                  </>
                )}
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <LoadingButton variant="contained" onClick={handleDownloadClick} loading={isDownloading}>
                Download Backup
              </LoadingButton>
              <LoadingButton
                variant="outlined"
                color="error"
                onClick={handleRestoreClick}
                loading={isRestoring}
              >
                Restore from CSV
              </LoadingButton>
              {/* Hidden CSV file input for restore */}
              <input
                type="file"
                accept=".csv,text/csv"
                ref={fileInputRef}
                onChange={handleFileSelected}
                style={{ display: 'none' }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {isGuestMode
                ? 'Note: Restore will replace existing mock transactions in guest mode. You will be asked to confirm before proceeding.'
                : 'Note: Restore will permanently replace all of your transactions with the contents of the selected CSV backup. You will be asked to confirm before proceeding.'}
            </Typography>
          </Stack>
        </Paper>

        {/* First confirmation: warning about data replacement */}
        <ConfirmDialog
          open={confirmRestoreOpen}
          title="Confirm Restore"
          message={
            isGuestMode
              ? 'This will replace all current mock transactions with the contents of the selected CSV. Do you want to continue?'
              : 'This will permanently replace all transactions in your account with the contents of the selected CSV. Do you want to continue?'
          }
          confirmText="Continue"
          cancelText="Cancel"
          confirmColor="warning"
          onConfirm={proceedToTypeToConfirm}
          onCancel={() => {
            if (!isRestoring) {
              setConfirmRestoreOpen(false)
              setRestoreFile(null)
            }
          }}
        />

        {/* Second confirmation: type-to-confirm */}
        <Dialog
          open={confirmTypeOpen}
          onClose={() => !isRestoring && setConfirmTypeOpen(false)}
          PaperProps={{ sx: standardDialogPaperSx }}
        >
          <DialogTitle>Type to Confirm</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Please type <strong>{requiredConfirmText}</strong> to confirm restore.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && confirmInput.trim() === requiredConfirmText) {
                  e.preventDefault()
                  performRestore()
                }
              }}
              disabled={isRestoring}
              placeholder={requiredConfirmText}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmTypeOpen(false)} disabled={isRestoring}>
              Cancel
            </Button>
            <LoadingButton
              variant="contained"
              color="error"
              loading={isRestoring}
              disabled={confirmInput.trim() !== requiredConfirmText}
              onClick={performRestore}
            >
              Confirm Restore
            </LoadingButton>
          </DialogActions>
        </Dialog>

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


