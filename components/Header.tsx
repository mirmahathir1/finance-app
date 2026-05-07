'use client'

import { AppBar, Toolbar, Typography, Box, Avatar } from '@mui/material'
import { AccountCircle } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'

export function Header() {
  const { user } = useAuth()

  const getUserInitials = (email: string): string => {
    return email.charAt(0).toUpperCase()
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Finance App
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {user ? (
            <>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {getUserInitials(user.email)}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {user.email}
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
