'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Slide,
} from '@mui/material'
import {
  GetApp as GetAppIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

export function InstallPrompt() {
  const pathname = usePathname()
  const { isInstalled, isAvailable, handleInstall } = useInstallPrompt()
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Show prompt if available and not on sign in page
    if (isAvailable && pathname !== '/auth/signin') {
      setShowPrompt(true)
    } else {
      setShowPrompt(false)
    }
  }, [isAvailable, pathname])

  const handleDismiss = () => {
    setShowPrompt(false)
    // Prompt will show again on next page load if still installable
  }

  // Don't show if already installed, not available, or on sign in page
  if (isInstalled || !showPrompt || !isAvailable || pathname === '/auth/signin') {
    return null
  }

  return (
    <Slide direction="down" in={showPrompt} mountOnEnter unmountOnExit>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1300,
          p: { xs: 1.5, sm: 2 },
          maxWidth: { xs: 'calc(100% - 16px)', sm: 400 },
          width: { xs: 'calc(100% - 16px)', sm: '90%' },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
          <GetAppIcon color="primary" sx={{ fontSize: { xs: 24, sm: 28 } }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="body1" 
              fontWeight="bold"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Install Finance App
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Add to home screen for quick access
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleDismiss}
            sx={{ 
              ml: 'auto',
              flexShrink: 0,
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Button
          variant="contained"
          size="small"
          onClick={() => {
            handleInstall()
            setShowPrompt(false)
          }}
          startIcon={<GetAppIcon />}
          fullWidth={false}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            minWidth: { xs: 'auto', sm: 100 },
            alignSelf: { xs: 'stretch', sm: 'auto' },
          }}
        >
          Install
        </Button>
      </Paper>
    </Slide>
  )
}

