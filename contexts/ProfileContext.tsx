'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react'
import type { Profile, Transaction, TransactionQueryParams } from '@/types'
import {
  getAllProfiles,
  getActiveProfile,
  setActiveProfile as setActiveProfileDB,
  addProfile as addProfileDB,
  deleteProfile as deleteProfileDB,
} from '@/utils/indexedDB'
import { useApi } from '@/utils/useApi'
import { getFriendlyErrorMessage } from '@/utils/error'
import { useAuth } from './AuthContext'

interface DeleteProfileOptions {
  /**
   * Optional affected transaction count from a preview call.
   * When provided, the context will not re-fetch the preview.
   */
  affectedCount?: number | null
}

interface ProfileContextType {
  profiles: Profile[]
  activeProfile: string | null
  isLoading: boolean
  error: string | null
  clearError: () => void
  addProfile: (name: string) => Promise<void>
  renameProfile: (oldName: string, newName: string) => Promise<void>
  deleteProfile: (name: string, options?: DeleteProfileOptions) => Promise<void>
  switchProfile: (name: string) => Promise<void>
  refreshProfiles: () => Promise<void>
  importProfilesFromTransactions: () => Promise<{ added: number; skipped: number }>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const api = useApi()
  const { user, isGuestMode, isLoading: authLoading } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeProfile, setActiveProfile] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const activeLoadCountRef = useRef(0)

  const authStateKey = user ? `user:${user.id}` : isGuestMode ? 'guest' : 'signed-out'

  const TRANSACTION_PAGE_SIZE = 200

  const countTransactions = async (
    params: TransactionQueryParams = {}
  ): Promise<number> => {
    const response = await api.getTransactions({
      ...params,
      limit: 1,
      offset: 0,
    })
    if (!response.success || !response.data) {
      throw new Error(
        !response.success
          ? response.error.message
          : 'Failed to count transactions.'
      )
    }
    return (
      response.data.pagination?.total ??
      response.data.transactions?.length ??
      0
    )
  }

  const fetchTransactions = async (
    params: TransactionQueryParams = {}
  ): Promise<Transaction[]> => {
    const results: Transaction[] = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const response = await api.getTransactions({
        ...params,
        limit: TRANSACTION_PAGE_SIZE,
        offset,
      })
      if (!response.success || !response.data) {
        throw new Error(
          !response.success
            ? response.error.message
            : 'Failed to load transactions.'
        )
      }
      const batch = response.data.transactions ?? []
      results.push(...batch)
      hasMore = response.data.pagination?.hasMore ?? false
      offset += TRANSACTION_PAGE_SIZE
      if (!hasMore) {
        break
      }
    }

    return results
  }

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (authStateKey === 'signed-out') {
      setProfiles([])
      setActiveProfile(null)
      setError(null)
      setIsLoading(false)
      return
    }

    const initialize = async () => {
      // Show loader during initialization to prevent race conditions
      // This ensures pages wait for profiles to load before checking profilesLoading
      await loadProfiles({ showLoader: true })
      // Auto-populate is now handled by the setup page using the catalog API
      // This avoids multiple paginated API calls on mount
    }
    initialize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStateKey, authLoading])

  const loadProfiles = async (options: { showLoader?: boolean } = {}) => {
    const { showLoader = true } = options
    try {
      activeLoadCountRef.current += 1
      if (showLoader) {
        setIsLoading(true)
      }
      setError(null)
      const allProfiles = await getAllProfiles()
      let active = await getActiveProfile()
      if (!active && allProfiles.length > 0) {
        active = allProfiles[0].name
        await setActiveProfileDB(active)
      }
      setProfiles(allProfiles)
      setActiveProfile(active)
    } catch (error) {
      setError(getFriendlyErrorMessage(error, 'Failed to load profiles.'))
    } finally {
      activeLoadCountRef.current = Math.max(0, activeLoadCountRef.current - 1)
      if (activeLoadCountRef.current === 0) {
        setIsLoading(false)
      } else if (showLoader) {
        setIsLoading(true)
      }
    }
  }

  /**
   * Import profiles from transactions
   */
  const importProfilesFromTransactions = async (): Promise<{
    added: number
    skipped: number
  }> => {
    try {
      const transactions = await fetchTransactions()
      const uniqueProfiles = new Set<string>()
      for (const transaction of transactions) {
        if (transaction.profile) {
          uniqueProfiles.add(transaction.profile)
        }
      }

      const existingProfiles = await getAllProfiles()
      const existingNames = new Set(existingProfiles.map((p) => p.name))

      let added = 0
      let skipped = 0

      for (const profileName of uniqueProfiles) {
        if (!existingNames.has(profileName)) {
          try {
            await addProfileDB(profileName)
            added++
          } catch (error: any) {
            if (
              error?.name === 'ConstraintError' ||
              error?.message?.includes('already exists')
            ) {
              skipped++
            } else {
              throw error
            }
          }
        } else {
          skipped++
        }
      }

      if (added > 0) {
        const currentActive = await getActiveProfile()
        if (!currentActive && uniqueProfiles.size > 0) {
          const firstProfile = Array.from(uniqueProfiles)[0]
          await setActiveProfileDB(firstProfile)
          setActiveProfile(firstProfile)
        }
      }

      await loadProfiles({ showLoader: false })

      return { added, skipped }
    } catch (error) {
      throw error
    }
  }

  const addProfile = async (name: string) => {
    // Validate
    if (!name || name.trim() === '') {
      throw new Error('Profile name cannot be empty')
    }

    const trimmedName = name.trim()

    const existingProfiles = await getAllProfiles()
    if (
      existingProfiles.some(
        (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      throw new Error('A profile with this name already exists')
    }

    await addProfileDB(trimmedName)

    if (profiles.length === 0 && !activeProfile) {
      await setActiveProfileDB(trimmedName)
      setActiveProfile(trimmedName)
    }

    await loadProfiles({ showLoader: false })
  }

  const renameProfile = async (oldName: string, newName: string) => {
    if (!newName || newName.trim() === '') {
      throw new Error('Profile name cannot be empty')
    }

    const trimmedNewName = newName.trim()

    if (trimmedNewName === oldName) {
      throw new Error('New name must be different from current name')
    }

    const existingProfiles = await getAllProfiles()
    if (
      existingProfiles.some(
        (p) => p.name.toLowerCase() === trimmedNewName.toLowerCase()
      )
    ) {
      throw new Error('A profile with this name already exists')
    }

    // Update all transactions with the old profile name in a single database query
    const response = await api.bulkUpdateTransactionsProfile(oldName, trimmedNewName)
    if (!response.success) {
      throw new Error(
        response.error?.message || 'Failed to update transactions'
      )
    }

    const profile = existingProfiles.find((p) => p.name === oldName)
    if (profile) {
      await deleteProfileDB(oldName)
      await addProfileDB(trimmedNewName)
    }

    if (activeProfile === oldName) {
      await setActiveProfileDB(trimmedNewName)
      setActiveProfile(trimmedNewName)
    }

    await loadProfiles({ showLoader: false })
  }

  const deleteProfile = async (name: string, options?: DeleteProfileOptions) => {
    // Validate
    if (activeProfile === name) {
      throw new Error('Cannot delete the active profile. Please switch to another profile first.')
    }

    const inferredCount =
      options?.affectedCount ?? (await countTransactions({ profile: name }))

    if (inferredCount > 0) {
      throw new Error(
        `Cannot delete profile: it is used in ${inferredCount} transaction(s). Please delete or reassign all transactions before deleting the profile.`
      )
    }

    await deleteProfileDB(name)

    await loadProfiles({ showLoader: false })
  }

  const switchProfile = async (name: string) => {
    const existingProfiles = await getAllProfiles()
    if (!existingProfiles.some((p) => p.name === name)) {
      throw new Error(`Profile "${name}" not found`)
    }

    await setActiveProfileDB(name)
    setActiveProfile(name)
  }

  const refreshProfiles = async () => {
    await loadProfiles({ showLoader: false })
  }

  const clearError = () => setError(null)

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        isLoading,
        error,
        clearError,
        addProfile,
        renameProfile,
        deleteProfile,
        switchProfile,
        refreshProfiles,
        importProfilesFromTransactions,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}

