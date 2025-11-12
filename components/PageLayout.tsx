'use client'

import { Box, Container } from '@mui/material'
import { Header } from './Header'
import { GlobalProgressBar } from './GlobalProgressBar'

interface PageLayoutProps {
  children: React.ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
}

export function PageLayout({ children, maxWidth = 'lg' }: PageLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <GlobalProgressBar />
      <Header />
      <Container maxWidth={maxWidth} sx={{ flex: 1, py: 4 }}>
        {children}
      </Container>
    </Box>
  )
}

