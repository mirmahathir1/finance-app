'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'

/**
 * StartupRedirect component
 * Handles app startup logic and redirects:
 * - Guest mode → dashboard
 * - Authenticated → dashboard or setup (if no profiles)
 * - If no active profile: set first profile as active
 */
export function StartupRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isGuestMode, isLoading: authLoading } = useAuth()
  const { profiles, activeProfile, isLoading: profilesLoading, switchProfile } = useProfile()

  useEffect(() => {
    // Wait for auth to load first - this is critical
    if (authLoading) {
      return
    }

    // Skip redirect logic for auth pages
    const authPaths = ['/auth/signin', '/auth/signup', '/auth/verify', '/auth/set-password', '/auth/forgot-password', '/auth/reset-password', '/auth/mock-email']
    if (authPaths.includes(pathname)) {
      return
    }

    // Skip redirect logic for setup and initialization pages
    if (pathname === '/setup' || pathname === '/initializing') {
      return
    }

    // CRITICAL: Check authentication FIRST - do this immediately, don't wait
    // Allow Guest Mode to proceed (API is intercepted client-side)

    // If not authenticated (no real user), redirect to sign-in immediately
    if (!user) {
      // Use replace to avoid adding to history
      if (pathname !== '/auth/signin') {
        router.replace('/auth/signin')
      }
      return
    }

    // Only proceed with profile checks if we have a real authenticated user
    // (not guest mode - we already handled that above)
    const handleStartup = async () => {
      try {
        // Wait for profiles to load
        if (profilesLoading) {
          return
        }

        // If profiles exist but no active profile, set first profile as active
        if (profiles.length > 0 && !activeProfile) {
          await switchProfile(profiles[0].name)
        }

        // Note: We don't redirect to setup if no profiles exist
        // Users can access the dashboard and go to setup manually if needed

        // If we're on the root path and have profiles, we're already on dashboard
        // No redirect needed
      } catch {
        // Ignore startup redirect errors
      }
    }

    handleStartup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profilesLoading, profiles.length, activeProfile, pathname, user, isGuestMode, router])

  // Show loading state while checking auth (profiles can load after)
  if (authLoading) {
    return null // Or a loading spinner if desired
  }

  // Allow auth pages, setup page, and initialization page to render even when not authenticated
  const authPaths = ['/auth/signin', '/auth/signup', '/auth/verify', '/auth/set-password', '/auth/forgot-password', '/auth/reset-password', '/auth/mock-email']
  const isAuthPage = authPaths.includes(pathname)
  const isSetupPage = pathname === '/setup'
  const isInitializingPage = pathname === '/initializing'

  // If on auth page, setup page, or initialization page, always render (these pages handle their own logic)
  if (isAuthPage || isSetupPage || isInitializingPage) {
    return <>{children}</>
  }

  // If not authenticated (no real user), don't render children yet
  // (will redirect to sign-in)
  if (!user) {
    return null
  }
  
  // Allow guest mode to render children as API is intercepted

  return <>{children}</>
}

