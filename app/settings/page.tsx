'use client'

import { useState, useCallback, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Paper,
  Typography,
  Alert,
  Divider,
  TextField,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material'
import {
  Logout as LogoutIcon,
  DeleteForever as DeleteForeverIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material'
import { PageLayout } from '@/components/PageLayout'
import { AnimatedSection } from '@/components/AnimatedSection'
import { LoadingButton } from '@/components/LoadingButton'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Snackbar } from '@/components/Snackbar'
import { useAuth } from '@/contexts/AuthContext'
import { useApi } from '@/utils/useApi'
import { getFriendlyErrorMessage } from '@/utils/error'
import { useThemeMode } from '@/components/ThemeProvider'

type PasswordStrength = 'weak' | 'medium' | 'strong'

export default function SettingsPage() {
  const router = useRouter()
  const { user, isGuestMode, isLoading: authLoading, signOut } = useAuth()
  const { mode, toggleColorMode } = useThemeMode()
  const api = useApi()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<{
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  }>({})
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({
    open: false,
    message: '',
    severity: 'info',
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth/signin')
    }
  }, [authLoading, user, router])

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsSigningOut(false)
    }
  }, [signOut])

  const handleOpenDeleteDialog = useCallback(() => {
    setDeleteAccountError(null)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleCloseDeleteDialog = useCallback(() => {
    if (isDeletingAccount) return
    setIsDeleteDialogOpen(false)
  }, [isDeletingAccount])

  const handleConfirmDeleteAccount = useCallback(async () => {
    if (isDeletingAccount) return

    setIsDeletingAccount(true)
    setDeleteAccountError(null)

    try {
      const response = await api.deleteAccount()
      if (!response.success) {
        throw new Error(response.error.message || 'Failed to delete account.')
      }

      setIsDeleteDialogOpen(false)
      await signOut()
    } catch (error) {
      setDeleteAccountError(
        getFriendlyErrorMessage(error, 'Failed to delete account.')
      )
    } finally {
      setIsDeletingAccount(false)
    }
  }, [api, signOut, isDeletingAccount])

  if (authLoading || !user) {
    return null
  }

  const checkPasswordRequirements = (pwd: string) => ({
    minLength: pwd.length >= 8,
    hasUppercase: /[A-Z]/.test(pwd),
    hasLowercase: /[a-z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecial: /[!@#$%^&*]/.test(pwd),
  })

  const getPasswordStrength = (pwd: string): PasswordStrength => {
    if (pwd.length === 0) return 'weak'
    const reqs = checkPasswordRequirements(pwd)
    const metCount = Object.values(reqs).filter(Boolean).length
    if (metCount <= 2) return 'weak'
    if (metCount <= 4) return 'medium'
    return 'strong'
  }

  const allRequirementsMet = (pwd: string): boolean => {
    const reqs = checkPasswordRequirements(pwd)
    return Object.values(reqs).every(Boolean)
  }

  const requirements = checkPasswordRequirements(newPassword)
  const strength = getPasswordStrength(newPassword)
  const strengthValue = strength === 'weak' ? 33 : strength === 'medium' ? 66 : 100
  const strengthColor =
    strength === 'weak' ? 'error' : strength === 'medium' ? 'warning' : 'success'

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormErrors({})

    const errors: {
      currentPassword?: string
      newPassword?: string
      confirmPassword?: string
    } = {}

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required'
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required'
    } else if (!allRequirementsMet(newPassword)) {
      errors.newPassword = 'Password does not meet all requirements'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password'
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await api.changePassword(currentPassword, newPassword)
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Password updated successfully.',
          severity: 'success',
        })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setShowPasswords(false)
      } else {
        const errorMessage =
          !response.success && 'error' in response
            ? response.error.message
            : 'Failed to update password.'
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        })
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: getFriendlyErrorMessage(error, 'Failed to update password.'),
        severity: 'error',
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const bannerActions = (
    <Button
      variant="contained"
      color="primary"
      startIcon={<ArrowBackIcon />}
      onClick={() => router.push('/')}
    >
      Back to Dashboard
    </Button>
  )

  return (
    <PageLayout
      pageName="Settings"
      bannerActions={bannerActions}
      showSettingsShortcut={false}
    >

      <AnimatedSection delay={75}>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Update your password regularly to keep your account secure.
          </Typography>
          <Box component="form" onSubmit={handleChangePassword}>
            <TextField
              fullWidth
              label="Current Password"
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={!!formErrors.currentPassword}
              helperText={formErrors.currentPassword}
              margin="normal"
              autoComplete="current-password"
              disabled={isChangingPassword}
            />
            <TextField
              fullWidth
              label="New Password"
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={!!formErrors.newPassword}
              helperText={formErrors.newPassword}
              margin="normal"
              autoComplete="new-password"
              disabled={isChangingPassword}
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              margin="normal"
              autoComplete="new-password"
              disabled={isChangingPassword}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  disabled={isChangingPassword}
                />
              }
              label="Show passwords"
              sx={{ mt: 1 }}
            />
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Password requirements
              </Typography>
              <List dense>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {requirements.minLength ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <CancelIcon color="error" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary="At least 8 characters long"
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: requirements.minLength ? 'text.primary' : 'text.secondary',
                    }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {requirements.hasUppercase && requirements.hasLowercase ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <CancelIcon color="error" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary="Contains uppercase and lowercase letters"
                    primaryTypographyProps={{
                      variant: 'body2',
                      color:
                        requirements.hasUppercase && requirements.hasLowercase
                          ? 'text.primary'
                          : 'text.secondary',
                    }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {requirements.hasNumber ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <CancelIcon color="error" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary="Contains at least one number"
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: requirements.hasNumber ? 'text.primary' : 'text.secondary',
                    }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {requirements.hasSpecial ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <CancelIcon color="error" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary="Contains at least one special character (!@#$%^&*)"
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: requirements.hasSpecial ? 'text.primary' : 'text.secondary',
                    }}
                  />
                </ListItem>
              </List>
            </Box>
            {newPassword && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Password strength:
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={strengthValue}
                  color={strengthColor}
                  sx={{ height: 8, borderRadius: 1 }}
                />
                <Typography
                  variant="caption"
                  color={`${strengthColor}.main`}
                  sx={{ display: 'block', mt: 0.5 }}
                >
                  {strength.charAt(0).toUpperCase() + strength.slice(1)}
                </Typography>
              </Box>
            )}
            <LoadingButton
              type="submit"
              variant="contained"
              size="large"
              loading={isChangingPassword}
              disabled={
                isChangingPassword ||
                !currentPassword ||
                !allRequirementsMet(newPassword) ||
                newPassword !== confirmPassword
              }
            >
              Update Password
            </LoadingButton>
          </Box>
        </Paper>
      </AnimatedSection>

      <AnimatedSection delay={120}>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Appearance
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Customize the appearance of the app.
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {mode === 'dark' ? (
                <DarkModeIcon color="primary" />
              ) : (
                <LightModeIcon color="primary" />
              )}
              <Box>
                <Typography variant="body1">Dark Mode</Typography>
                <Typography variant="body2" color="text.secondary">
                  {mode === 'dark'
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              onClick={toggleColorMode}
              startIcon={mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              sx={{ minWidth: 150 }}
            >
              {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </Box>
        </Paper>
      </AnimatedSection>

      <AnimatedSection delay={165}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage account level actions including signing out or permanently deleting your account.
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            {!isGuestMode && (
              <LoadingButton
                variant="contained"
                color="warning"
                startIcon={<DeleteForeverIcon />}
                onClick={handleOpenDeleteDialog}
                disabled={isDeletingAccount}
                sx={{ minWidth: 220 }}
              >
                Delete Account
              </LoadingButton>
            )}
            <LoadingButton
              variant="contained"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={handleSignOut}
              loading={isSigningOut}
              sx={{ minWidth: 220 }}
            >
              Sign Out
            </LoadingButton>
          </Box>
          {deleteAccountError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteAccountError}
            </Alert>
          )}
        </Paper>
      </AnimatedSection>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="Delete your account?"
        message="This will permanently remove your account and all transactions. This action cannot be undone."
        confirmText="Delete account"
        confirmColor="error"
        onConfirm={handleConfirmDeleteAccount}
        onCancel={handleCloseDeleteDialog}
      />
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </PageLayout>
  )
}

