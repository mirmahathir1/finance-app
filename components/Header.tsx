'use client'

import { AppBar, Toolbar, Typography, Box, Avatar } from '@mui/material'
import { AccountCircle } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'

export function Header() {
  const { user, isGuestMode } = useAuth()

  const getUserInitials = (email: string): string => {
    return email.charAt(0).toUpperCase()
  }

  const displayEmail = user?.email || 'Guest'

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Finance App
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isGuestMode && (
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Guest Mode
            </Typography>
          )}
          {user ? (
            <>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {getUserInitials(user.email)}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {displayEmail}
              </Typography>
            </>
          ) : (
            <AccountCircle />
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

