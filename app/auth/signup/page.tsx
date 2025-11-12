'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Divider,
  Paper,
} from '@mui/material'
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import { useApi } from '@/utils/useApi'
import { Snackbar } from '@/components/Snackbar'

export default function SignUpPage() {
  const router = useRouter()
  const { enterGuestMode } = useAuth()
  const api = useApi()
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [errors, setErrors] = useState<{ email?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    if (!email.trim()) {
      setErrors({ email: 'Email is required' })
      return
    }
    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await api.signupRequest(email.trim())
      if (response.success) {
        setEmailSent(true)
      } else {
        const errorMessage =
          !response.success && 'error' in response
            ? response.error.message
            : 'Failed to send verification email. Please try again.'
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        })
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to send verification email. Please try again.',
        severity: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    setIsSubmitting(true)
    try {
      const response = await api.signupRequest(email.trim())
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Verification link sent successfully',
          severity: 'success',
        })
      } else {
        const errorMessage =
          !response.success && 'error' in response
            ? response.error.message
            : 'Failed to resend verification email. Please try again.'
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        })
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to resend verification email. Please try again.',
        severity: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGuestMode = async () => {
    try {
      await enterGuestMode()
      setSnackbar({
        open: true,
        message: 'Entered guest mode',
        severity: 'success',
      })
      // Redirect is handled by enterGuestMode function
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to enter guest mode',
        severity: 'error',
      })
    }
  }

  if (emailSent) {
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
                Check Your Email
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" gutterBottom>
                We&apos;ve sent a verification link to:
              </Typography>
              <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
                {email}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Please check your inbox and click the link to verify your email address.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                The link will expire in 15 minutes.
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={handleResend}
              disabled={isSubmitting}
              sx={{ mb: 3 }}
            >
              Resend Verification Link
            </Button>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" component="div">
                <strong>Didn&apos;t receive the email?</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Check your spam folder</li>
                  <li>Make sure you entered the correct email</li>
                  <li>Wait a few minutes and try resending</li>
                </ul>
              </Typography>
            </Alert>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                href="/auth/mock-email"
                variant="body2"
                sx={{ textDecoration: 'none' }}
              >
                View Mock Email (Demo)
              </Link>
            </Box>
          </Paper>
        </Box>

        <Snackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </Container>
    )
  }

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
              Create Your Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start tracking your finances today
            </Typography>
          </Box>

          {/* Sign Up Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Sign Up
            </Typography>

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              margin="normal"
              required
              autoComplete="email"
              disabled={isSubmitting}
            />

            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              We&apos;ll send you a verification link to confirm your email address.
            </Alert>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2 }}
              disabled={isSubmitting}
            >
              Send Verification Link
            </Button>
          </Box>

          {/* Divider */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* Guest Mode Button */}
          <Box sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              size="large"
              onClick={handleGuestMode}
              disabled={isSubmitting}
              sx={{ py: 1.5 }}
            >
              Continue as Guest
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
              (Explore with demo data)
            </Typography>
          </Box>

          {/* Sign In Link */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link href="/auth/signin" sx={{ textDecoration: 'none' }}>
                Sign In
              </Link>
            </Typography>
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

