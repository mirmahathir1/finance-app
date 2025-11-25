'use client'

import { ReactNode } from 'react'
import { Paper, Box, Typography, Avatar, Button } from '@mui/material'
import { Settings as SettingsIcon } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface AuthBannerProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  showSettingsButton?: boolean
}

export function AuthBanner({
  title = 'Finance App',
  subtitle,
  actions,
  showSettingsButton = false,
}: AuthBannerProps) {
  const router = useRouter()
  const { user, isGuestMode } = useAuth()

  const displayEmail = user?.email || 'Guest'

  const getUserInitials = (email: string): string => {
    return email.charAt(0).toUpperCase()
  }

  return (
    <Paper
      elevation={3}
      sx={{
        mb: 4,
        px: 3,
        py: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        gap: 2,
        backgroundImage: 'linear-gradient(135deg, #1e88e5, #3949ab)',
        color: 'primary.contrastText',
        borderRadius: '30px',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, justifyContent: 'flex-start', alignItems: 'flex-start' }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
          justifyContent: 'flex-start',
          alignSelf: 'center',
          ml: 'auto',
        }}
      >
        {isGuestMode && (
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Guest Mode
          </Typography>
        )}
        {user ? (
          <>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main' }}>
              {getUserInitials(displayEmail)}
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {displayEmail}
            </Typography>
          </>
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Guest
          </Typography>
        )}
        {actions}
        {showSettingsButton && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<SettingsIcon />}
            onClick={() => router.push('/settings')}
          >
            Settings
          </Button>
        )}
      </Box>
    </Paper>
  )
}

