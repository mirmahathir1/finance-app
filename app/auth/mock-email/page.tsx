'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Link,
  Divider,
  Alert,
} from '@mui/material'
import { Email as EmailIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material'

type EmailType = 'verification' | 'reset'

function MockEmailPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailType = (searchParams.get('type') as EmailType) || 'verification'
  const [email] = useState('user@example.com')
  const [baseUrl, setBaseUrl] = useState('')

  // Generate mock tokens
  const verificationToken = 'mock_verification_token_12345'
  const resetToken = 'mock_reset_password_token_12345'

  // Set base URL only on client side to avoid hydration mismatch
  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const handleVerificationClick = () => {
    router.push(`/auth/verify?token=${verificationToken}`)
  }

  const handleResetClick = () => {
    router.push(`/auth/reset-password?token=${resetToken}`)
  }

  const verificationEmail = (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" paragraph>
          Hello,
        </Typography>
        <Typography variant="body1" paragraph>
          Thank you for signing up for Finance App!
        </Typography>
        <Typography variant="body1" paragraph>
          Please verify your email address by clicking the link below:
        </Typography>
      </Box>

      <Box sx={{ my: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleVerificationClick}
          sx={{ mb: 2 }}
        >
          Verify Email Address
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          Or copy and paste this link into your browser:
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            backgroundColor: 'grey.50',
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }}
        >
          {baseUrl
            ? `${baseUrl}/auth/verify?token=${verificationToken}`
            : `/auth/verify?token=${verificationToken}`}
        </Paper>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          This link will expire in 15 minutes.
        </Typography>
      </Alert>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          If you didn&apos;t create an account, you can safely ignore this email.
        </Typography>
      </Box>

      <Box>
        <Typography variant="body2" paragraph>
          Best regards,
        </Typography>
        <Typography variant="body2" fontWeight="bold">
          Finance App Team
        </Typography>
      </Box>
    </>
  )

  const resetEmail = (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" paragraph>
          Hello,
        </Typography>
        <Typography variant="body1" paragraph>
          We received a request to reset your password for your Finance App account.
        </Typography>
        <Typography variant="body1" paragraph>
          Click the link below to reset your password:
        </Typography>
      </Box>

      <Box sx={{ my: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          color="error"
          onClick={handleResetClick}
          sx={{ mb: 2 }}
        >
          Reset Password
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          Or copy and paste this link into your browser:
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            backgroundColor: 'grey.50',
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }}
        >
          {baseUrl
            ? `${baseUrl}/auth/reset-password?token=${resetToken}`
            : `/auth/reset-password?token=${resetToken}`}
        </Paper>
      </Box>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          This link will expire in 15 minutes. If you didn&apos;t request a password reset,
          you can safely ignore this email.
        </Typography>
      </Alert>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          If you didn&apos;t request a password reset, please ignore this email or contact
          support if you have concerns.
        </Typography>
      </Box>

      <Box>
        <Typography variant="body2" paragraph>
          Best regards,
        </Typography>
        <Typography variant="body2" fontWeight="bold">
          Finance App Team
        </Typography>
      </Box>
    </>
  )

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          py: 4,
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
            sx={{ mb: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            Mock Email (Demo)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This is a demonstration of the email that would be sent to users. In production,
            this email would be sent via Brevo (Sendinblue) email service.
          </Typography>
        </Box>

        {/* Email Client Mock */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Email Client (Mock)
            </Typography>
          </Box>

          {/* Email Header */}
          <Box
            sx={{
              mb: 3,
              p: 2,
              backgroundColor: 'grey.50',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2">
              <strong>From:</strong> no-reply@finance-app.com
            </Typography>
            <Typography variant="body2">
              <strong>To:</strong> {email}
            </Typography>
            <Typography variant="body2">
              <strong>Subject:</strong>{' '}
              {emailType === 'verification'
                ? 'Verify Your Email Address'
                : 'Reset Your Password'}
            </Typography>
          </Box>

          {/* Email Body */}
          <Box
            sx={{
              p: 3,
              backgroundColor: 'background.paper',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
            }}
          >
            {emailType === 'verification' ? verificationEmail : resetEmail}
          </Box>
        </Paper>

        {/* Navigation */}
        <Paper elevation={1} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => router.push('/auth/mock-email?type=verification')}
            >
              Verification Email
            </Button>
            <Button
              variant="contained"
              onClick={() => router.push('/auth/mock-email?type=reset')}
            >
              Reset Password Email
            </Button>
            <Divider orientation="vertical" flexItem />
            <Button variant="text" onClick={() => router.push('/auth/signup')}>
              Back to Sign Up
            </Button>
            <Button variant="text" onClick={() => router.push('/auth/forgot-password')}>
              Back to Forgot Password
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default function MockEmailPage() {
  return (
    <Suspense
      fallback={
        <Container maxWidth="md">
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
            <Typography variant="h6">Loading...</Typography>
          </Box>
        </Container>
      }
    >
      <MockEmailPageContent />
    </Suspense>
  )
}

