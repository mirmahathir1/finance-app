'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Box,
  Typography,
  TextField,
  Link,
  Paper,
} from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import { Snackbar } from '@/components/Snackbar'
import { LoadingButton } from '@/components/LoadingButton'
import { validateEmail, validateRequired } from '@/utils/validation'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { GetApp as GetAppIcon } from '@mui/icons-material'
import { Button } from '@mui/material'

export default function SignInPage() {
  const { signIn, isLoading: authLoading } = useAuth()
  const { isAvailable, handleInstall, isInstalled } = useInstallPrompt()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  const handleEmailChange = (value: string) => {
    setEmail(value)
    setErrors((prev) => ({
      ...prev,
      email: validateEmail(value) || undefined,
    }))
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setErrors((prev) => ({
      ...prev,
      password: validateRequired(value, 'Password is required') || undefined,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const emailError = validateEmail(email)
    const passwordError = validateRequired(password, 'Password is required')
    if (emailError || passwordError) {
      setErrors({
        email: emailError || undefined,
        password: passwordError || undefined,
      })
      return
    }

    setIsSubmitting(true)
    try {
      await signIn(email.trim(), password)
      setSnackbar({
        open: true,
        message: 'Signed in successfully',
        severity: 'success',
      })
      // Redirect is handled by signIn function
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to sign in. Please check your credentials.',
        severity: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
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
              Welcome to Finance App
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track your expenses and income
            </Typography>
          </Box>

          {/* Sign In Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Sign In
            </Typography>

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              margin="normal"
              required
              autoComplete="email"
              disabled={authLoading || isSubmitting}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              margin="normal"
              required
              autoComplete="current-password"
              disabled={authLoading || isSubmitting}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
              <Link
                href="/auth/forgot-password"
                variant="body2"
                sx={{ textDecoration: 'none' }}
              >
                Forgot password?
              </Link>
            </Box>

            <LoadingButton
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              loading={isSubmitting || authLoading}
              disabled={
                authLoading ||
                isSubmitting ||
                !!errors.email ||
                !!errors.password ||
                !email ||
                !password
              }
            >
              Sign In
            </LoadingButton>

            {!isInstalled && (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GetAppIcon />}
                onClick={handleInstall}
                disabled={!isAvailable}
                sx={{ mb: 2 }}
              >
                Install App
              </Button>
            )}
          </Box>

          {/* Sign Up Link */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" sx={{ textDecoration: 'none' }}>
                Sign Up
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

