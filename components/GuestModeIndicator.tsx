'use client'

import { Fab, Tooltip } from '@mui/material'
import { Person as PersonIcon } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'

export function GuestModeIndicator() {
  const { isGuestMode, enterGuestMode, exitGuestMode } = useAuth()

  const handleClick = async () => {
    try {
      if (isGuestMode) {
        await exitGuestMode()
      } else {
        await enterGuestMode()
      }
    } catch (error) {
      console.error('Error toggling guest mode:', error)
    }
  }

  return (
    <Tooltip 
      title={isGuestMode ? "Guest Mode - Click to exit" : "Click to enter Guest Mode"}
    >
      <Fab
        color={isGuestMode ? "secondary" : "default"}
        size="small"
        onClick={handleClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
        aria-label={isGuestMode ? "Exit Guest Mode" : "Enter Guest Mode"}
      >
        <PersonIcon />
      </Fab>
    </Tooltip>
  )
}

