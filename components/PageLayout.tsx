'use client'

import { Box, Container } from '@mui/material'
import { usePathname } from 'next/navigation'
import { GlobalProgressBar } from './GlobalProgressBar'
import { PageTransition } from './PageTransition'
import { Header } from './Header'

interface PageLayoutProps {
  children: React.ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
  showHeader?: boolean
}

export function PageLayout({
  children,
  maxWidth = 'lg',
  showHeader = true,
}: PageLayoutProps) {
  const pathname = usePathname()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <GlobalProgressBar />
      <PageTransition key={pathname}>
        <Container maxWidth={maxWidth} sx={{ flex: 1, py: 4 }}>
          {children}
        </Container>
      </PageTransition>
    </Box>
  )
}

