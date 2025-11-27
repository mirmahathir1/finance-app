'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@/types'
import {
  getGuestModeState,
  setGuestModeState,
  clearGuestModeState,
  clearAllData,
} from '@/utils/indexedDB'
import { useApi } from '@/utils/useApi'
import { guestDataService } from '@/services/guestDataService'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isGuestMode: boolean
  isBackendAvailable: boolean
  refreshBackendStatus: () => Promise<boolean>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  enterGuestMode: () => Promise<void>
  exitGuestMode: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Module-level flags to persist across component remounts (React Strict Mode)
// This prevents duplicate session checks when the component remounts
// These flags persist for the entire page load and are reset on full page reload
let globalAuthCheckInProgress = false
let globalSessionCheckInProgress = false
let cachedAuthResult: { user: User | null; isGuestMode: boolean } | null = null

// Reset flags on page unload to allow fresh checks on next page load
// Also reset on page visibility change to handle cases where the page is hidden/shown
if (typeof window !== 'undefined') {
  const resetAuthCache = () => {
    globalAuthCheckInProgress = false
    globalSessionCheckInProgress = false
    cachedAuthResult = null
  }

  window.addEventListener('beforeunload', resetAuthCache)

  // Also reset when page becomes visible (handles tab switching, etc.)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Don't reset on hide, only on unload
    }
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const api = useApi()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [isBackendAvailable, setIsBackendAvailable] = useState(false)
  const hasCheckedInitialAuth = useRef(false)
  const sessionCheckInProgress = useRef(false)

  const FORCE_GUEST_MODE =
    process.env.NEXT_PUBLIC_FORCE_GUEST_MODE === 'true'

  const clearBrowserStorage = async () => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      sessionStorage.clear()
    } catch {
      // Ignore session storage failures
    }

    try {
      localStorage.clear()
    } catch {
      // Ignore local storage failures
    }
  }

  const checkBackendAvailability = useCallback(async () => {
    if (FORCE_GUEST_MODE) {
      setIsBackendAvailable(false)
      return false
    }
    try {
      const response = await fetch('/api/health', { cache: 'no-store' })
      if (!response.ok) {
        setIsBackendAvailable(false)
        return false
      }
      const data = await response.json().catch(() => null)
      const healthy = Boolean(data?.ok)
      setIsBackendAvailable(healthy)
      return healthy
    } catch (error) {
      setIsBackendAvailable(false)
      return false
    }
  }, [FORCE_GUEST_MODE])

  const refreshBackendStatus = useCallback(async () => {
    return checkBackendAvailability()
  }, [checkBackendAvailability])

  useEffect(() => {
    // If we have cached results, restore them immediately and skip network work
    if (cachedAuthResult !== null) {
      setUser(cachedAuthResult.user)
      setIsGuestMode(cachedAuthResult.isGuestMode)
      setIsLoading(false)
      return
    }

    // If another auth check is already running (Strict Mode / remount), wait for it
    if (globalAuthCheckInProgress) {
      let isSubscribed = true
      const waitForCachedResult = async () => {
        const maxAttempts = 100
        let attempts = 0
        while (isSubscribed && globalAuthCheckInProgress && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts += 1
          if (cachedAuthResult !== null) {
            setUser(cachedAuthResult.user)
            setIsGuestMode(cachedAuthResult.isGuestMode)
            setIsLoading(false)
            return
          }
        }
        if (isSubscribed && cachedAuthResult === null) {
          setIsLoading(false)
        }
      }

      waitForCachedResult()
      return () => {
        isSubscribed = false
      }
    }

    // Prevent duplicate auth checks within the same component instance
    if (hasCheckedInitialAuth.current) {
      return
    }

    // Mark that we're starting the auth check to prevent duplicates
    hasCheckedInitialAuth.current = true
    globalAuthCheckInProgress = true

    // Check authentication state on mount
    const checkAuth = async () => {
      try {
        const backendAvailable = await checkBackendAvailability()
        let guestPreference = await getGuestModeState()

        if (FORCE_GUEST_MODE) {
          guestPreference = true
          await setGuestModeState(true)
        }

        setIsGuestMode(guestPreference)

        if (guestPreference) {
          // In guest mode, set mock user
          const userData = await guestDataService.getCurrentUser()
          const guestUser = {
            id: userData.user.id,
            email: userData.user.email,
            passwordHash: '', // Not needed for guest mode
            emailVerifiedAt: userData.user.emailVerifiedAt || null,
            createdAt: userData.user.createdAt,
            updatedAt: userData.user.updatedAt,
          }
          setUser(guestUser)
          // Cache the result for remounts
          cachedAuthResult = { user: guestUser, isGuestMode: true }
        } else if (backendAvailable) {
          // Check for existing session
          // Prevent duplicate calls using both ref and module-level flag
          // (React Strict Mode causes remounts which reset refs)
          // If a session check is already in progress, wait for it to complete
          if (sessionCheckInProgress.current || globalSessionCheckInProgress) {
            // Wait for the in-progress check to complete by polling
            let attempts = 0
            const maxAttempts = 50 // 5 seconds max wait (50 * 100ms)
            while ((sessionCheckInProgress.current || globalSessionCheckInProgress) && attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 100))
              attempts++
              // If cached result becomes available, use it
              if (cachedAuthResult !== null) {
                setUser(cachedAuthResult.user)
                setIsGuestMode(cachedAuthResult.isGuestMode)
                return
              }
            }
          }
          
          sessionCheckInProgress.current = true
          globalSessionCheckInProgress = true

          try {
            const response = await api.getCurrentUser()

            if (response.success && response.data) {
              const authenticatedUser = {
                id: response.data.user.id,
                email: response.data.user.email,
                passwordHash: '', // Not stored in client
                emailVerifiedAt: response.data.user.emailVerifiedAt || null,
                createdAt: response.data.user.createdAt,
                updatedAt: response.data.user.updatedAt,
              }
              setUser(authenticatedUser)
              // Cache the result for remounts
              cachedAuthResult = { user: authenticatedUser, isGuestMode: false }
            } else if (!response.success && response.error?.code === '401') {
              // 401 is expected when not authenticated - silently handle
              setUser(null)
              // Cache unauthenticated result to prevent duplicate calls during this session
              cachedAuthResult = { user: null, isGuestMode: false }
            } else {
              // Treat other error codes as unauthenticated for this session
              setUser(null)
              cachedAuthResult = { user: null, isGuestMode: false }
            }
          } catch (sessionError: any) {
            // Silently ignore 404s, 401s, or network errors when backend is not available
            // This is expected when building UI with mock data or when not authenticated
            const errorMessage = sessionError?.message || ''
            const is404 =
              errorMessage.includes('404') ||
              errorMessage.includes('not found') ||
              errorMessage.includes('Endpoint not found')
            const is401 =
              errorMessage.includes('401') ||
              errorMessage.includes('Unauthorized') ||
              errorMessage.includes('Not authenticated')
            const isNetworkError =
              errorMessage.includes('Failed to fetch') ||
              errorMessage.includes('NetworkError')

            if (is404 || is401 || isNetworkError) {
              // Backend not available or not authenticated - this is expected
              // No need to log or handle
              setUser(null)
              // Cache result to prevent repeated fetch loops until reload
              cachedAuthResult = { user: null, isGuestMode: false }
            }
          } finally {
            sessionCheckInProgress.current = false
            globalSessionCheckInProgress = false
          }
        } else {
          setUser(null)
          // Cache backend-unavailable state to avoid loops; reset on reload
          cachedAuthResult = { user: null, isGuestMode: false }
        }
      } catch {
        // Ignore unexpected errors during auth check
      } finally {
        setIsLoading(false)
        // Don't reset globalAuthCheckCompleted - keep it true for entire page load
      }
    }

    checkAuth().finally(() => {
      globalAuthCheckInProgress = false
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [FORCE_GUEST_MODE, api, checkBackendAvailability])

  const signIn = async (email: string, password: string) => {
    try {
      if (FORCE_GUEST_MODE) {
        throw new Error(
          'Guest Mode is enforced. Disable NEXT_PUBLIC_FORCE_GUEST_MODE to sign in.'
        )
      }

      const backendHealthy =
        isBackendAvailable || (await checkBackendAvailability())
      if (!backendHealthy) {
        throw new Error(
          'Server is currently unavailable. Please try again later or use Guest Mode.'
        )
      }

      // Preserve current guest mode state to decide post-login behavior
      const wasGuestMode = isGuestMode
      
      const response = await api.login(email, password)
      if (response.success && response.data) {
        // Clear all IndexedDB data at the start of sign-in to ensure data isolation
        // This prevents one user's setup data from being visible to another user
        // on the same browser/device
        await clearAllData()
        
        // Reset guest data service (in-memory data)
        guestDataService.reset()
        
        // Clear browser storage to ensure clean state
        await clearBrowserStorage()
        
        const authenticatedUser = {
          id: response.data.user.id,
          email: response.data.user.email,
          passwordHash: '', // Not stored in client
          emailVerifiedAt: response.data.user.emailVerifiedAt || null,
          createdAt: response.data.user.createdAt,
          updatedAt: response.data.user.updatedAt,
        }
        setUser(authenticatedUser)
        
        // If we were NOT in guest mode, ensure guest mode is cleared
        // If we WERE in guest mode, keep it enabled so API stays mocked
        if (!wasGuestMode) {
          setIsGuestMode(false)
          await clearGuestModeState()
          // Update cache
          cachedAuthResult = { user: authenticatedUser, isGuestMode: false }
        } else {
          // Update cache - keep guest mode enabled
          cachedAuthResult = { user: authenticatedUser, isGuestMode: true }
        }
        
        // Redirect to initialization page to handle prepopulation
        // This ensures a single loading page during setup
        router.push('/initializing')
      } else {
        const errorMessage =
          !response.success && 'error' in response
            ? response.error.message
            : 'Login failed. Please check your credentials.'
        throw new Error(errorMessage)
      }
    } catch (error) {
      throw error
    }
  }

  const signOut = async () => {
    try {
      await api.logout()
      
      // Clear all frontend data
      // 1. Clear all IndexedDB data (profiles, tags, currencies, settings, guest mode)
      await clearAllData()
      
      // 2. Reset guest data service (in-memory data)
      guestDataService.reset()
      
      // 3. Clear browser storage (session + local storage)
      await clearBrowserStorage()
      
      // 4. Clear local state
      setUser(null)
      setIsGuestMode(false)
      // Update cache
      cachedAuthResult = { user: null, isGuestMode: false }
      
      router.push('/auth/signin')
    } catch (_error) {
      // Still clear local state even if API call fails
      try {
        await clearAllData()
        guestDataService.reset()
        await clearBrowserStorage()
      } catch {
        // Ignore cleanup failures during sign out
      }
      setUser(null)
      setIsGuestMode(false)
      // Update cache
      cachedAuthResult = { user: null, isGuestMode: false }
      router.push('/auth/signin')
    }
  }

  const enterGuestMode = async () => {
    try {
      // Set guest mode state in IndexedDB first
      await setGuestModeState(true)
      setIsGuestMode(true)

      // Set mock user from guest data service
      const userData = await guestDataService.getCurrentUser()
      const guestUser = {
        id: userData.user.id,
        email: userData.user.email,
        passwordHash: '',
        emailVerifiedAt: userData.user.emailVerifiedAt || null,
        createdAt: userData.user.createdAt,
        updatedAt: userData.user.updatedAt,
      }
      setUser(guestUser)
      // Update cache
      cachedAuthResult = { user: guestUser, isGuestMode: true }

      // Only redirect if we're not already on the signin page
      // This prevents clearing form data when entering guest mode from signin
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth/signin') {
        router.push('/')
      }
      // If we're on signin page, stay there - StartupRedirect will handle the flow
    } catch (error) {
      throw error
    }
  }

  const exitGuestMode = async () => {
    try {
      const backendHealthy =
        isBackendAvailable || (await checkBackendAvailability())
      if (!backendHealthy) {
        throw new Error(
          'Cannot exit Guest Mode while the server is offline. Please try again later.'
        )
      }

      // Clear guest mode flag
      await clearGuestModeState()
      
      // Clear all frontend data
      // 1) IndexedDB stores (profiles, tags, currencies, settings, guest mode)
      await clearAllData()
      // 2) In-memory guest data
      guestDataService.reset()
      // 3) Browser storage (session + local)
      await clearBrowserStorage()
      
      // Reset local auth state
      setIsGuestMode(false)
      setUser(null)
      // Update cache
      cachedAuthResult = { user: null, isGuestMode: false }
      
      // Navigate to sign in
      router.push('/auth/signin')
    } catch (error) {
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isGuestMode,
        isBackendAvailable,
        refreshBackendStatus,
        signIn,
        signOut,
        enterGuestMode,
        exitGuestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

