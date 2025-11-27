'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'
import { useApi } from '@/utils/useApi'
import { Snackbar } from '@/components/Snackbar'
import { LoadingButton } from '@/components/LoadingButton'

type PageState = 'verifying' | 'form' | 'success' | 'error'

interface PasswordRequirements {
  minLength: boolean
}

function ResetPasswordPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const api = useApi()
  const [state, setState] = useState<PageState>('verifying')
  const [token, setToken] = useState<string>('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [errors, setErrors] = useState<{
    password?: string
    confirmPassword?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    
    if (!tokenParam) {
      setState('error')
      setErrorMessage('Reset token is missing. Please check your email link.')
      return
    }

    setToken(tokenParam)

    const verifyToken = async () => {
      try {
        const response = await api.verifyResetPasswordToken(tokenParam)
        if (response.success && response.data) {
          setState('form')
        } else {
          const errorMsg =
            !response.success && 'error' in response
              ? response.error.message
              : 'Reset link is invalid or has expired.'
          setState('error')
          setErrorMessage(errorMsg)
        }
      } catch (error: any) {
        setState('error')
        setErrorMessage(
          error.message || 'Reset link is invalid or has expired.'
        )
      }
    }

    verifyToken()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkPasswordRequirements = (pwd: string): PasswordRequirements => {
    return {
      minLength: pwd.length >= 6,
    }
  }

  const allRequirementsMet = (pwd: string): boolean => {
    const requirements = checkPasswordRequirements(pwd)
    return Object.values(requirements).every(Boolean)
  }

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

    setIsSubmitting(true)
    try {
      const response = await api.resetPassword(token, password)
      if (response.success) {
        setState('success')
        // Auto-redirect to sign in after 2 seconds
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      } else {
        const errorMsg =
          !response.success && 'error' in response
            ? response.error.message
            : 'Failed to reset password. Please try again.'
        setSnackbar({
          open: true,
          message: errorMsg,
          severity: 'error',
        })
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to reset password. Please try again.',
        severity: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const requirements = checkPasswordRequirements(password)

  // Verifying token state
  if (state === 'verifying') {
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
          <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Finance App
            </Typography>
            <Box sx={{ my: 4 }}>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Verifying Reset Link...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we verify your reset link.
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    )
  }

  // Error state
  if (state === 'error') {
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
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" component="h1" gutterBottom>
                Reset Link Invalid or Expired
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {errorMessage || 'This reset link is invalid or has expired.'}
              </Typography>
            </Box>

            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" component="div">
                <strong>This can happen if:</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>The link has expired (links expire after 15 minutes)</li>
                  <li>The link has already been used</li>
                  <li>The link is invalid</li>
                </ul>
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => router.push('/auth/forgot-password')}
                size="large"
              >
                Request New Reset Link
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Or return to:{' '}
                <Button
                  variant="text"
                  onClick={() => router.push('/auth/forgot-password')}
                  sx={{ textTransform: 'none' }}
                >
                  Forgot Password
                </Button>
                {' or '}
                <Button
                  variant="text"
                  onClick={() => router.push('/auth/signin')}
                  sx={{ textTransform: 'none' }}
                >
                  Sign In
                </Button>
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    )
  }

  // Success state
  if (state === 'success') {
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
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" component="h1" gutterBottom>
                Password Reset Successfully!
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Your password has been reset successfully. You can now sign in with your new password.
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={() => router.push('/auth/signin')}
              size="large"
            >
              Continue to Sign In
            </Button>

            <Alert severity="info" sx={{ mt: 3 }}>
              Redirecting to sign in page...
            </Alert>
          </Paper>
        </Box>
      </Container>
    )
  }

  // Form state
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
              Reset Your Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a new secure password
            </Typography>
          </Box>

          {/* Reset Password Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h5" component="h2" gutterBottom>
              Reset Password
            </Typography>

            <TextField
              fullWidth
              label="New Password"
              type={showPasswords ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              margin="normal"
              required
              autoComplete="new-password"
              disabled={isSubmitting}
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              margin="normal"
              required
              autoComplete="new-password"
              disabled={isSubmitting}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  disabled={isSubmitting}
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
              disabled={!allRequirementsMet(password) || password !== confirmPassword}
              size="large"
            >
              Reset Password
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
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
            <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
              <Typography variant="h4" component="h1" gutterBottom>
                Finance App
              </Typography>
              <Box sx={{ my: 4 }}>
                <CircularProgress size={48} sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Loading...
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Container>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  )
}

