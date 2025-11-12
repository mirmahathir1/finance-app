'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  Paper,
} from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import { Snackbar } from '@/components/Snackbar'

export default function SignInPage() {
  const router = useRouter()
  const { signIn, isLoading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
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
    const newErrors: { email?: string; password?: string } = {}
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!password) {
      newErrors.password = 'Password is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

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
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              margin="normal"
              required
              autoComplete="email"
              disabled={authLoading}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              margin="normal"
              required
              autoComplete="current-password"
              disabled={authLoading}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={authLoading}
                  />
                }
                label="Remember me"
              />
              <Link
                href="/auth/forgot-password"
                variant="body2"
                sx={{ textDecoration: 'none' }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={authLoading}
            >
              Sign In
            </Button>
          </Box>

          {/* Sign Up Link */}
          <Box sx={{ textAlign: 'center' }}>
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

