'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Paper,
  LinearProgress,
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

type PasswordStrength = 'weak' | 'medium' | 'strong'

interface PasswordRequirements {
  minLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecial: boolean
}

export default function SetPasswordPage() {
  const router = useRouter()
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
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*]/.test(pwd),
    }
  }

  const getPasswordStrength = (pwd: string): PasswordStrength => {
    if (pwd.length === 0) return 'weak'
    const requirements = checkPasswordRequirements(pwd)
    const metCount = Object.values(requirements).filter(Boolean).length
    if (metCount <= 2) return 'weak'
    if (metCount <= 4) return 'medium'
    return 'strong'
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
      const response = await api.setPassword(password)
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Password set successfully! Redirecting to setup...',
          severity: 'success',
        })
        // Redirect to setup page after 1.5 seconds
        setTimeout(() => {
          router.push('/setup')
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
  const strength = getPasswordStrength(password)
  const strengthValue = strength === 'weak' ? 33 : strength === 'medium' ? 66 : 100
  const strengthColor =
    strength === 'weak' ? 'error' : strength === 'medium' ? 'warning' : 'success'

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
              disabled={isSubmitting}
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
                    primary="At least 8 characters"
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: requirements.minLength ? 'text.primary' : 'text.secondary',
                    }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {requirements.hasUppercase ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <CancelIcon color="error" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary="Contains uppercase and lowercase letters"
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: requirements.hasUppercase && requirements.hasLowercase
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

            {/* Password Strength Indicator */}
            {password && (
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

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={isSubmitting || !allRequirementsMet(password) || password !== confirmPassword}
              size="large"
            >
              Create Account
            </Button>
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

