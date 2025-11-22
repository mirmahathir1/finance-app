'use client'

import { ReactNode } from 'react'
import { Box, Container } from '@mui/material'
import { usePathname } from 'next/navigation'
import { GlobalProgressBar } from './GlobalProgressBar'
import { PageTransition } from './PageTransition'
import { AnimatedSection } from './AnimatedSection'
import { AuthBanner } from './AuthBanner'
import { useAuth } from '@/contexts/AuthContext'

interface PageLayoutProps {
  children: ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
  showHeader?: boolean
  pageName?: string
  bannerTitle?: string
  bannerSubtitle?: string
  bannerActions?: ReactNode
  showSettingsShortcut?: boolean
}

export function PageLayout({
  children,
  maxWidth = 'lg',
  showHeader = true,
  pageName,
  bannerTitle,
  bannerSubtitle,
  bannerActions,
  showSettingsShortcut = false,
}: PageLayoutProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const computedTitle =
    bannerTitle ??
    (pageName ? `Finance App - ${pageName}` : 'Finance App')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <GlobalProgressBar />
      <PageTransition key={pathname}>
        <Container maxWidth={maxWidth} sx={{ flex: 1, py: 4 }}>
          {showHeader && user && (
            <AnimatedSection>
              <AuthBanner
                title={computedTitle}
                subtitle={bannerSubtitle}
                actions={bannerActions}
                showSettingsButton={showSettingsShortcut}
              />
            </AnimatedSection>
          )}
          {children}
        </Container>
      </PageTransition>
    </Box>
  )
}

