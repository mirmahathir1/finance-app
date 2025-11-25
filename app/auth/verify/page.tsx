'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Container,
  Box,
  Typography,
  Button,
  Link,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { useApi } from '@/utils/useApi'

type VerificationState = 'loading' | 'success' | 'error' | 'already-verified'

function VerifyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const api = useApi()
  const [state, setState] = useState<VerificationState>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const token = searchParams.get('token') || ''

  useEffect(() => {
    if (!token) {
      setState('error')
      setErrorMessage('Verification token is missing. Please check your email link.')
      return
    }

    const verify = async () => {
      try {
        const response = await api.verifyEmail(token)
        if (response.success && response.data) {
          // In mock mode, always succeed
          setState('success')
          // Auto-redirect to set password page after 2 seconds
          setTimeout(() => {
            router.push(`/auth/set-password?token=${encodeURIComponent(token)}`)
          }, 2000)
        } else {
          const errorMsg =
            !response.success && 'error' in response
              ? response.error.message
              : 'Verification failed. Please try again.'
          
          // Check if it's an "already verified" error
          if (errorMsg.toLowerCase().includes('already verified')) {
            setState('already-verified')
          } else {
            setState('error')
            setErrorMessage(errorMsg)
          }
        }
      } catch (error: any) {
        setState('error')
        setErrorMessage(
          error.message || 'Verification failed. The link may be invalid or expired.'
        )
      }
    }

    verify()
  }, [token, api, router])

  const handleRequestNewLink = () => {
    router.push('/auth/signup')
  }

  if (state === 'loading') {
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
                Verifying Your Email...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we verify your email address.
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    )
  }

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
                Email Verified!
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Your email address has been successfully verified. You can now set your
                password and start using the app.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() =>
                  router.push(`/auth/set-password?token=${encodeURIComponent(token)}`)
                }
                size="large"
              >
                Set Your Password
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => router.push('/auth/signin')}
              >
                Sign In
              </Button>
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              Redirecting to password setup page...
            </Alert>
          </Paper>
        </Box>
      </Container>
    )
  }

  if (state === 'already-verified') {
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
              <InfoIcon sx={{ fontSize: 64, color: 'info.main', mb: 2 }} />
              <Typography variant="h5" component="h1" gutterBottom>
                Already Verified
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Your email address has already been verified.
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={() => router.push('/auth/signin')}
              size="large"
            >
              Sign In
            </Button>
          </Paper>
        </Box>
      </Container>
    )
  }

  // Error state
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
              Verification Failed
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {errorMessage || 'This verification link is invalid or has expired.'}
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
              onClick={handleRequestNewLink}
              size="large"
            >
              Request New Verification Link
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Or return to:{' '}
              <Link href="/auth/signup" sx={{ textDecoration: 'none' }}>
                Sign Up
              </Link>
              {' or '}
              <Link href="/auth/signin" sx={{ textDecoration: 'none' }}>
                Sign In
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default function VerifyPage() {
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
      <VerifyPageContent />
    </Suspense>
  )
}

