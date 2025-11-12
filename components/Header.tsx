'use client'

import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material'
import { AccountCircle, Logout as LogoutIcon } from '@mui/icons-material'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export function Header() {
  const { user, isGuestMode, signOut } = useAuth()
  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    handleMenuClose()
    await signOut()
    router.push('/')
  }

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isGuestMode && (
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Guest Mode
            </Typography>
          )}
          <IconButton
            size="large"
            edge="end"
            aria-label="account menu"
            aria-controls="account-menu"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
          >
            {user ? (
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {getUserInitials(user.email)}
              </Avatar>
            ) : (
              <AccountCircle />
            )}
          </IconButton>
          <Menu
            id="account-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {displayEmail}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

