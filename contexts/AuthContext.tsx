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
import { clearAllData } from '@/utils/indexedDB'
import { useApi } from '@/utils/useApi'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isBackendAvailable: boolean
  refreshBackendStatus: () => Promise<boolean>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Module-level flags persist across component remounts in React Strict Mode.
let globalAuthCheckInProgress = false
let globalSessionCheckInProgress = false
let cachedAuthResult: { user: User | null } | null = null

if (typeof window !== 'undefined') {
  const resetAuthCache = () => {
    globalAuthCheckInProgress = false
    globalSessionCheckInProgress = false
    cachedAuthResult = null
  }

  window.addEventListener('beforeunload', resetAuthCache)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const api = useApi()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBackendAvailable, setIsBackendAvailable] = useState(false)
  const hasCheckedInitialAuth = useRef(false)
  const sessionCheckInProgress = useRef(false)

  const clearBrowserStorage = async () => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      sessionStorage.clear()
    } catch {
      // Ignore session storage failures.
    }

    try {
      localStorage.clear()
    } catch {
      // Ignore local storage failures.
    }
  }

  const checkBackendAvailability = useCallback(async () => {
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
    } catch {
      setIsBackendAvailable(false)
      return false
    }
  }, [])

  const refreshBackendStatus = useCallback(async () => {
    return checkBackendAvailability()
  }, [checkBackendAvailability])

  useEffect(() => {
    if (cachedAuthResult !== null) {
      setUser(cachedAuthResult.user)
      setIsLoading(false)
      return
    }

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

    if (hasCheckedInitialAuth.current) {
      return
    }

    hasCheckedInitialAuth.current = true
    globalAuthCheckInProgress = true

    const checkAuth = async () => {
      try {
        const backendAvailable = await checkBackendAvailability()

        if (backendAvailable) {
          if (sessionCheckInProgress.current || globalSessionCheckInProgress) {
            let attempts = 0
            const maxAttempts = 50
            while ((sessionCheckInProgress.current || globalSessionCheckInProgress) && attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 100))
              attempts++
              if (cachedAuthResult !== null) {
                setUser(cachedAuthResult.user)
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
                passwordHash: '',
                emailVerifiedAt: response.data.user.emailVerifiedAt || null,
                createdAt: response.data.user.createdAt,
                updatedAt: response.data.user.updatedAt,
              }
              setUser(authenticatedUser)
              cachedAuthResult = { user: authenticatedUser }
            } else {
              setUser(null)
              cachedAuthResult = { user: null }
            }
          } catch {
            setUser(null)
            cachedAuthResult = { user: null }
          } finally {
            sessionCheckInProgress.current = false
            globalSessionCheckInProgress = false
          }
        } else {
          setUser(null)
          cachedAuthResult = { user: null }
        }
      } catch {
        setUser(null)
        cachedAuthResult = { user: null }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth().finally(() => {
      globalAuthCheckInProgress = false
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, checkBackendAvailability])

  const signIn = async (email: string, password: string) => {
    const backendHealthy =
      isBackendAvailable || (await checkBackendAvailability())
    if (!backendHealthy) {
      throw new Error('Server is currently unavailable. Please try again later.')
    }

    const response = await api.login(email, password)
    if (response.success && response.data) {
      await clearAllData()
      await clearBrowserStorage()

      const authenticatedUser = {
        id: response.data.user.id,
        email: response.data.user.email,
        passwordHash: '',
        emailVerifiedAt: response.data.user.emailVerifiedAt || null,
        createdAt: response.data.user.createdAt,
        updatedAt: response.data.user.updatedAt,
      }
      setUser(authenticatedUser)
      cachedAuthResult = { user: authenticatedUser }

      router.push('/initializing')
      return
    }

    const errorMessage =
      !response.success && 'error' in response
        ? response.error.message
        : 'Login failed. Please check your credentials.'
    throw new Error(errorMessage)
  }

  const signOut = async () => {
    try {
      await api.logout()

      await clearAllData()
      await clearBrowserStorage()

      setUser(null)
      cachedAuthResult = { user: null }

      router.push('/auth/signin')
    } catch {
      try {
        await clearAllData()
        await clearBrowserStorage()
      } catch {
        // Ignore cleanup failures during sign out.
      }
      setUser(null)
      cachedAuthResult = { user: null }
      router.push('/auth/signin')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isBackendAvailable,
        refreshBackendStatus,
        signIn,
        signOut,
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
