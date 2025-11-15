'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Profile } from '@/types'
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

interface ProfileContextType {
  profiles: Profile[]
  activeProfile: string | null
  isLoading: boolean
  error: string | null
  clearError: () => void
  addProfile: (name: string) => Promise<void>
  renameProfile: (oldName: string, newName: string) => Promise<void>
  deleteProfile: (name: string) => Promise<void>
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

  const authStateKey = user ? `user:${user.id}` : isGuestMode ? 'guest' : 'signed-out'

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
      await loadProfiles()
      if (!isGuestMode) {
        await autoPopulateProfiles()
      }
    }
    initialize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStateKey, authLoading])

  const loadProfiles = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const allProfiles = await getAllProfiles()
      const active = await getActiveProfile()
      setProfiles(allProfiles)
      setActiveProfile(active)
    } catch (error) {
      console.error('Error loading profiles:', error)
      setError(getFriendlyErrorMessage(error, 'Failed to load profiles.'))
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Auto-populate profiles from transactions if IndexedDB is empty
   * Runs silently at startup
   */
  const autoPopulateProfiles = async () => {
    if (isGuestMode) {
      return
    }

    try {
      const currentProfiles = await getAllProfiles()
      // Only auto-populate if profiles are empty
      if (currentProfiles.length === 0) {
        await importProfilesFromTransactions()
      }
    } catch (error) {
      // Silently fail - this is a convenience feature
      console.debug('Auto-populate profiles failed:', error)
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
      // Get all transactions
      const response = await api.getTransactions({})
      if (!response.success || !response.data) {
        return { added: 0, skipped: 0 }
      }

      const transactions = response.data.transactions || []
      
      // Extract unique profile names
      const uniqueProfiles = new Set<string>()
      for (const transaction of transactions) {
        if (transaction.profile) {
          uniqueProfiles.add(transaction.profile)
        }
      }

      // Get existing profiles
      const existingProfiles = await getAllProfiles()
      const existingNames = new Set(existingProfiles.map((p) => p.name))

      let added = 0
      let skipped = 0

      // Add new profiles (skip existing)
      for (const profileName of uniqueProfiles) {
        if (!existingNames.has(profileName)) {
          try {
            await addProfileDB(profileName)
            added++
          } catch (error: any) {
            // Handle ConstraintError if profile was added between check and add
            if (error?.name === 'ConstraintError' || error?.message?.includes('already exists')) {
              skipped++
            } else {
              // Re-throw other errors
              throw error
            }
          }
        } else {
          skipped++
        }
      }

      // Set first profile as active if no active profile exists
      if (added > 0) {
        const currentActive = await getActiveProfile()
        if (!currentActive && uniqueProfiles.size > 0) {
          const firstProfile = Array.from(uniqueProfiles)[0]
          await setActiveProfileDB(firstProfile)
          setActiveProfile(firstProfile)
        }
      }

      // Reload profiles
      await loadProfiles()

      return { added, skipped }
    } catch (error) {
      console.error('Error importing profiles:', error)
      throw error
    }
  }

  const addProfile = async (name: string) => {
    // Validate
    if (!name || name.trim() === '') {
      throw new Error('Profile name cannot be empty')
    }

    const trimmedName = name.trim()

    // Check for duplicates
    const existingProfiles = await getAllProfiles()
    if (existingProfiles.some((p) => p.name === trimmedName)) {
      throw new Error('A profile with this name already exists')
    }

    // Add to IndexedDB
    await addProfileDB(trimmedName)

    // If this is the first profile, set it as active
    if (profiles.length === 0 && !activeProfile) {
      await setActiveProfileDB(trimmedName)
      setActiveProfile(trimmedName)
    }

    // Reload profiles
    await loadProfiles()
  }

  const renameProfile = async (oldName: string, newName: string) => {
    // Validate
    if (!newName || newName.trim() === '') {
      throw new Error('Profile name cannot be empty')
    }

    const trimmedNewName = newName.trim()

    if (trimmedNewName === oldName) {
      throw new Error('New name must be different from current name')
    }

    // Check for duplicates
    const existingProfiles = await getAllProfiles()
    if (existingProfiles.some((p) => p.name === trimmedNewName)) {
      throw new Error('A profile with this name already exists')
    }

    // Preview rename to get affected count
    const previewResponse = await api.previewProfileRename(oldName)
    if (!previewResponse.success) {
      throw new Error(
        previewResponse.error?.message || 'Failed to preview profile rename'
      )
    }

    const affectedCount = previewResponse.data?.affectedCount || 0

    // If there are affected transactions, update them via API
    if (affectedCount > 0) {
      const renameResponse = await api.renameProfile(oldName, trimmedNewName)
      if (!renameResponse.success) {
        throw new Error(
          renameResponse.error?.message || 'Failed to rename profile'
        )
      }
    }

    // Update in IndexedDB
    // Since IndexedDB uses name as key, we need to delete and recreate
    const profile = existingProfiles.find((p) => p.name === oldName)
    if (profile) {
      await deleteProfileDB(oldName)
      await addProfileDB(trimmedNewName)
    }

    // Update active profile if it was renamed
    if (activeProfile === oldName) {
      await setActiveProfileDB(trimmedNewName)
      setActiveProfile(trimmedNewName)
    }

    // Reload profiles
    await loadProfiles()
  }

  const deleteProfile = async (name: string) => {
    // Validate
    if (activeProfile === name) {
      throw new Error('Cannot delete the active profile. Please switch to another profile first.')
    }

    // Preview delete to check if profile is used
    const previewResponse = await api.previewProfileDelete(name)
    if (!previewResponse.success) {
      throw new Error(
        previewResponse.error?.message || 'Failed to preview profile delete'
      )
    }

    const affectedCount = previewResponse.data?.affectedCount || 0

    // If profile is used in transactions, block deletion
    if (affectedCount > 0) {
      throw new Error(
        `Cannot delete profile: it is used in ${affectedCount} transaction(s). Please delete or reassign all transactions before deleting the profile.`
      )
    }

    // Delete via API (for validation)
    const deleteResponse = await api.deleteProfile(name)
    if (!deleteResponse.success) {
      throw new Error(
        deleteResponse.error?.message || 'Failed to delete profile'
      )
    }

    // Delete from IndexedDB
    await deleteProfileDB(name)

    // Reload profiles
    await loadProfiles()
  }

  const switchProfile = async (name: string) => {
    // Validate profile exists
    const existingProfiles = await getAllProfiles()
    if (!existingProfiles.some((p) => p.name === name)) {
      throw new Error(`Profile "${name}" not found`)
    }

    await setActiveProfileDB(name)
    setActiveProfile(name)
  }

  const refreshProfiles = async () => {
    await loadProfiles()
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

