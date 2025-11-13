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

export default function BackupRestorePage() {
  const router = useRouter()
  const { activeProfile } = useProfile()
  const api = useApi()
  const { startLoading, stopLoading } = useLoading()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false)
  const [confirmTypeOpen, setConfirmTypeOpen] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')
  const requiredConfirmText = activeProfile || 'Finance App'
  const [isRestoring, setIsRestoring] = useState(false)

  const handleDownloadClick = async () => {
    try {
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
          ('error' in response && response.error?.message) ||
          'Failed to generate backup'
        setSnackbar({
          open: true,
          message,
          severity: 'error',
        })
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.message || 'Failed to generate backup',
        severity: 'error',
      })
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
      const text = await restoreFile.text()
      // Replace transactions from CSV
      const { imported } = guestDataService.importTransactionsFromCSV(text)
      setSnackbar({
        open: true,
        message: `Restore complete: imported ${imported} transaction(s).`,
        severity: 'success',
      })
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

  return (
    <PageLayout>
      <Container maxWidth="md">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Backup & Restore</Typography>
          <Button variant="outlined" onClick={() => router.push('/')}>
            Back to Dashboard
          </Button>
        </Box>

        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Stack spacing={2}>
            <Typography variant="body1">
              Active Profile: <strong>{activeProfile || 'None selected'}</strong>
            </Typography>
            <Alert severity="info">
              This backup includes transactions for your app data. Identifiers such as <code>id</code> and <code>user_id</code> are excluded from the CSV.
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={handleDownloadClick}>
                Download Backup
              </Button>
              <Button variant="outlined" color="error" onClick={handleRestoreClick}>
                Restore from CSV
              </Button>
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
              Note: Restore will replace existing mock transactions in guest mode. You will be asked to confirm before proceeding in the next step.
            </Typography>
          </Stack>
        </Paper>

        {/* First confirmation: warning about data replacement */}
        <ConfirmDialog
          open={confirmRestoreOpen}
          title="Confirm Restore"
          message="This will replace all current mock transactions with the contents of the selected CSV. Do you want to continue?"
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
        <Dialog open={confirmTypeOpen} onClose={() => !isRestoring && setConfirmTypeOpen(false)}>
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
            <Button
              variant="contained"
              color="error"
              disabled={isRestoring || confirmInput.trim() !== requiredConfirmText}
              onClick={performRestore}
            >
              Confirm Restore
            </Button>
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


