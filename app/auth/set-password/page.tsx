'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Container,
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material'
import { useApi } from '@/utils/useApi'
import { Snackbar } from '@/components/Snackbar'
import { LoadingButton } from '@/components/LoadingButton'

interface PasswordRequirements {
  minLength: boolean
}

export default function SetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const api = useApi()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [errors, setErrors] = useState<{
    password?: string
    confirmPassword?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  const checkPasswordRequirements = (pwd: string): PasswordRequirements => {
    return {
      minLength: pwd.length >= 6,
    }
  }

  const allRequirementsMet = (pwd: string): boolean => {
    const requirements = checkPasswordRequirements(pwd)
    return Object.values(requirements).every(Boolean)
  }

  const token = searchParams.get('token')
  const isTokenMissing = !token

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: { password?: string; confirmPassword?: string } = {}

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (!allRequirementsMet(password)) {
      newErrors.password = 'Password does not meet all requirements'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (isTokenMissing) {
      setSnackbar({
        open: true,
        message: 'Verification link is missing or invalid. Please use the email link to access this page.',
        severity: 'error',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await api.setPassword(token, password)
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Password set successfully! Redirecting to dashboard...',
          severity: 'success',
        })
        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        const errorMessage =
          !response.success && 'error' in response
            ? response.error.message
            : 'Failed to set password. Please try again.'
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        })
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to set password. Please try again.',
        severity: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const requirements = checkPasswordRequirements(password)

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          {/* Logo/Title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Finance App
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Set Your Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a secure password for your account
            </Typography>
          </Box>

          {/* Set Password Form */}
          <Box component="form" onSubmit={handleSubmit}>
            {isTokenMissing && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                This page requires a valid verification link. Please open it from your email again to continue.
              </Alert>
            )}
            <Typography variant="h5" component="h2" gutterBottom>
              Set Password
            </Typography>

            <TextField
              fullWidth
              label="Password"
              type={showPasswords ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              margin="normal"
              required
              autoComplete="new-password"
              disabled={isSubmitting || isTokenMissing}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              margin="normal"
              required
              autoComplete="new-password"
              disabled={isSubmitting || isTokenMissing}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  disabled={isSubmitting || isTokenMissing}
                />
              }
              label="Show passwords"
              sx={{ mt: 1 }}
            />

            {/* Password Requirements */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Password Requirements:
              </Typography>
              <List dense sx={{ py: 0 }}>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {requirements.minLength ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <CancelIcon color="error" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary="At least 6 characters"
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: requirements.minLength ? 'text.primary' : 'text.secondary',
                    }}
                  />
                </ListItem>
              </List>
            </Box>

            <LoadingButton
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              loading={isSubmitting}
              disabled={
                isTokenMissing ||
                !allRequirementsMet(password) ||
                password !== confirmPassword ||
                isSubmitting
              }
              size="large"
            >
              Create Account
            </LoadingButton>
          </Box>
        </Paper>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Container>
  )
}

