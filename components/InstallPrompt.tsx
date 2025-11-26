'use client'

import { useState, useEffect } from 'react'
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

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if dismissed recently (within last 7 days)
    const dismissedTime = localStorage.getItem('installPromptDismissed')
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) {
        return
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Store dismissal in localStorage to avoid showing again for a while
    localStorage.setItem('installPromptDismissed', Date.now().toString())
  }

  // Don't show if already installed or if prompt shouldn't be shown
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <Slide direction="down" in={showPrompt} mountOnEnter unmountOnExit>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          p: 2,
          maxWidth: 400,
          width: '90%',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <GetAppIcon color="primary" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" fontWeight="bold">
            Install Finance App
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add to home screen for quick access
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          onClick={handleInstall}
          startIcon={<GetAppIcon />}
        >
          Install
        </Button>
        <IconButton
          size="small"
          onClick={handleDismiss}
          sx={{ ml: 1 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Paper>
    </Slide>
  )
}

