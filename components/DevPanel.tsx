'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Fab,
  Paper,
  IconButton,
  Tooltip,
  Slide,
  Button,
} from '@mui/material'
import {
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingButton } from './LoadingButton'
import { Snackbar } from './Snackbar'
import { clearAllData } from '@/utils/indexedDB'
import { guestDataService } from '@/services/guestDataService'

const MAILHOG_HTTP_URL =
  process.env.NEXT_PUBLIC_MAILHOG_HTTP_URL || 'http://localhost:8025'
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'

export function DevPanel() {
  const router = useRouter()
  const { isGuestMode, enterGuestMode, exitGuestMode } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [isHardResetting, setIsHardResetting] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const handleHide = () => {
    setIsExpanded(false)
    setIsHidden(true)
  }

  const handleShow = () => {
    setIsHidden(false)
  }

  const handleGuestModeToggle = async () => {
    try {
      if (isGuestMode) {
        await exitGuestMode()
        setSnackbar({
          open: true,
          message: 'Exited Guest Mode',
          severity: 'success',
        })
      } else {
        await enterGuestMode()
        setSnackbar({
          open: true,
          message: 'Entered Guest Mode',
          severity: 'success',
        })
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.message || 'Failed to toggle guest mode',
        severity: 'error',
      })
    }
  }

  const handleHardReset = async () => {
    if (isHardResetting) {
      return
    }
    setIsHardResetting(true)
    try {
      await clearAllData()
      guestDataService.reset()
      try {
        sessionStorage.clear()
      } catch {
        // Ignore session storage clearing failures
      }
      try {
        localStorage.clear()
      } catch {
        // Ignore local storage clearing failures
      }
      setSnackbar({
        open: true,
        message: 'All local data cleared successfully.',
        severity: 'success',
      })
      router.refresh()
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.message || 'Failed to clear local data.',
        severity: 'error',
      })
    } finally {
      setIsHardResetting(false)
    }
  }

  if (isHidden) {
    return (
      <IconButton
        onClick={handleShow}
        size="small"
        sx={{
          position: 'fixed',
          bottom: 8,
          right: 8,
          zIndex: 1000,
          width: 24,
          height: 24,
          minWidth: 24,
          padding: 0.5,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          },
        }}
        aria-label="Show Dev Panel"
      >
        <ArrowUpIcon sx={{ fontSize: 16 }} />
      </IconButton>
    )
  }

  return (
    <>
      {/* Floating toggle button */}
      <IconButton
        onClick={handleToggleExpand}
        size="small"
        sx={{
          position: 'fixed',
          bottom: isExpanded ? 280 : 8,
          right: 8,
          zIndex: 1001,
          transition: 'bottom 0.3s ease-in-out',
          width: 24,
          height: 24,
          minWidth: 24,
          padding: 0.5,
          backgroundColor: isExpanded ? 'rgba(156, 39, 176, 0.2)' : 'rgba(0, 0, 0, 0.1)',
          '&:hover': {
            backgroundColor: isExpanded ? 'rgba(156, 39, 176, 0.3)' : 'rgba(0, 0, 0, 0.2)',
          },
        }}
        aria-label={isExpanded ? 'Collapse Dev Panel' : 'Expand Dev Panel'}
      >
        {isExpanded ? <ArrowDownIcon sx={{ fontSize: 16 }} /> : <ArrowUpIcon sx={{ fontSize: 16 }} />}
      </IconButton>

      {/* Expandable panel */}
      <Slide direction="up" in={isExpanded} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            p: 2,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Box sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              Developer Panel
            </Box>
            <Tooltip title="Hide Panel">
              <IconButton size="small" onClick={handleHide}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Content */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {/* Guest Mode Toggle */}
            <Button
              variant="contained"
              color={isGuestMode ? 'secondary' : 'primary'}
              size="medium"
              onClick={handleGuestModeToggle}
              startIcon={<PersonIcon />}
              aria-label={
                isGuestMode ? 'Exit Guest Mode' : 'Enter Guest Mode'
              }
            >
              {isGuestMode ? 'Exit Guest Mode' : 'Enter Guest Mode'}
            </Button>

            {/* Hard Reset Button */}
            <LoadingButton
              variant="contained"
              color="error"
              size="medium"
              onClick={handleHardReset}
              loading={isHardResetting}
            >
              Hard Reset
            </LoadingButton>

            {/* MailHog Button (Development only) */}
            {IS_DEVELOPMENT && (
              <Button
                variant="contained"
                color="info"
                size="medium"
                href={MAILHOG_HTTP_URL}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<EmailIcon />}
                endIcon={<OpenInNewIcon />}
              >
                MailHog
              </Button>
            )}
          </Box>
        </Paper>
      </Slide>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </>
  )
}

