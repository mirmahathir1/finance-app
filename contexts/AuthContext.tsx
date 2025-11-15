'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@/types'
import {
  getGuestModeState,
  setGuestModeState,
  clearGuestModeState,
  getAllProfiles,
  clearAllData,
} from '@/utils/indexedDB'
import { useApi } from '@/utils/useApi'
import { guestDataService } from '@/services/guestDataService'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isGuestMode: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  enterGuestMode: () => Promise<void>
  exitGuestMode: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const api = useApi()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGuestMode, setIsGuestMode] = useState(false)

  const clearBrowserStorage = async () => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      sessionStorage.clear()
    } catch (error) {
      console.warn('Unable to clear sessionStorage during logout:', error)
    }

    try {
      localStorage.clear()
    } catch (error) {
      console.warn('Unable to clear localStorage during logout:', error)
    }
  }

  useEffect(() => {
    // Check authentication state on mount
    const checkAuth = async () => {
      try {
        const guestMode = await getGuestModeState()
        setIsGuestMode(guestMode)

        if (guestMode) {
          // In guest mode, set mock user
          const userData = await guestDataService.getCurrentUser()
          setUser({
            id: userData.user.id,
            email: userData.user.email,
            passwordHash: '', // Not needed for guest mode
            emailVerifiedAt: userData.user.emailVerifiedAt || null,
            createdAt: userData.user.createdAt,
            updatedAt: userData.user.updatedAt,
          })
        } else {
          // Check for existing session
          // Silently handle 404s (backend not available yet)
          try {
            const response = await api.getCurrentUser()
            if (response.success && response.data) {
              setUser({
                id: response.data.user.id,
                email: response.data.user.email,
                passwordHash: '', // Not stored in client
                emailVerifiedAt: response.data.user.emailVerifiedAt || null,
                createdAt: response.data.user.createdAt,
                updatedAt: response.data.user.updatedAt,
              })
            }
          } catch (sessionError: any) {
            // Silently ignore 404s or network errors when backend is not available
            // This is expected when building UI with mock data
            const errorMessage = sessionError?.message || ''
            const is404 = errorMessage.includes('404') || 
                         errorMessage.includes('not found') ||
                         errorMessage.includes('Endpoint not found')
            const isNetworkError = errorMessage.includes('Failed to fetch') ||
                                  errorMessage.includes('NetworkError')
            
            if (is404 || isNetworkError) {
              // Backend not available - this is expected in development
              // No need to log or handle
            } else {
              console.error('Error checking session:', sessionError)
            }
          }
        }
      } catch (error) {
        // Only log unexpected errors
        if (error instanceof Error && !error.message.includes('404')) {
          console.error('Error checking auth state:', error)
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      // Preserve current guest mode state to decide post-login behavior
      const wasGuestMode = isGuestMode
      
      const response = await api.login(email, password)
      if (response.success && response.data) {
        setUser({
          id: response.data.user.id,
          email: response.data.user.email,
          passwordHash: '', // Not stored in client
          emailVerifiedAt: response.data.user.emailVerifiedAt || null,
          createdAt: response.data.user.createdAt,
          updatedAt: response.data.user.updatedAt,
        })
        
        // If we were NOT in guest mode, ensure guest mode is cleared
        // If we WERE in guest mode, keep it enabled so API stays mocked
        if (!wasGuestMode) {
          setIsGuestMode(false)
          await clearGuestModeState()
        }
        
        // Check if profiles exist - if not, redirect to setup
        try {
          const profiles = await getAllProfiles()
          if (profiles.length === 0) {
            router.push('/setup')
          } else {
            router.push('/')
          }
        } catch (profileError) {
          // If we can't check profiles, just go to root and let StartupRedirect handle it
          router.push('/')
        }
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
      if (!isGuestMode) {
        await api.logout()
      }
      
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
      
      router.push('/auth/signin')
    } catch (error) {
      console.error('Error signing out:', error)
      // Still clear local state even if API call fails
      try {
        await clearAllData()
        guestDataService.reset()
        await clearBrowserStorage()
      } catch (clearError) {
        console.error('Error clearing data during sign out:', clearError)
      }
      setUser(null)
      setIsGuestMode(false)
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
      setUser({
        id: userData.user.id,
        email: userData.user.email,
        passwordHash: '',
        emailVerifiedAt: userData.user.emailVerifiedAt || null,
        createdAt: userData.user.createdAt,
        updatedAt: userData.user.updatedAt,
      })

      // Only redirect if we're not already on the signin page
      // This prevents clearing form data when entering guest mode from signin
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth/signin') {
        router.push('/')
      }
      // If we're on signin page, stay there - StartupRedirect will handle the flow
    } catch (error) {
      console.error('Error entering guest mode:', error)
      throw error
    }
  }

  const exitGuestMode = async () => {
    try {
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
      
      // Navigate to sign in
      router.push('/auth/signin')
    } catch (error) {
      console.error('Error exiting guest mode:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isGuestMode,
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

