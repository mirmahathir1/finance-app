'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Tag, TransactionType } from '@/types'
import {
  getTagsForProfile,
  addTag as addTagDB,
  updateTag as updateTagDB,
  deleteTag as deleteTagDB,
} from '@/utils/indexedDB'
import { useProfile } from './ProfileContext'
import { useApi } from '@/utils/useApi'
import { getFriendlyErrorMessage } from '@/utils/error'

interface TagContextType {
  tags: Tag[]
  isLoading: boolean
  error: string | null
  clearError: () => void
  getTagsByType: (type: TransactionType) => Tag[]
  addTag: (
    name: string,
    type: TransactionType,
    color?: string
  ) => Promise<void>
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>
  renameTag: (id: string, newName: string) => Promise<void>
  deleteTag: (id: string) => Promise<void>
  refreshTags: () => Promise<void>
  importTagsFromTransactions: () => Promise<{ added: number; skipped: number }>
}

const TagContext = createContext<TagContextType | undefined>(undefined)

export function TagProvider({ children }: { children: ReactNode }) {
  const { activeProfile } = useProfile()
  const api = useApi()
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (activeProfile) {
      loadTags()
    } else {
      setTags([])
      setIsLoading(false)
      setError(null)
    }
  }, [activeProfile])

  const loadTags = async () => {
    if (!activeProfile) return

    try {
      setIsLoading(true)
      setError(null)
      const profileTags = await getTagsForProfile(activeProfile)
      setTags(profileTags)
    } catch (error) {
      console.error('Error loading tags:', error)
      setError(getFriendlyErrorMessage(error, 'Failed to load tags.'))
    } finally {
      setIsLoading(false)
    }
  }

  const getTagsByType = (type: TransactionType): Tag[] => {
    return tags.filter((tag) => tag.type === type)
  }

  const addTag = async (
    name: string,
    type: TransactionType,
    color?: string
  ) => {
    if (!activeProfile) {
      throw new Error('No active profile selected')
    }

    // Validate
    if (!name || name.trim() === '') {
      throw new Error('Tag name cannot be empty')
    }

    const trimmedName = name.trim()

    // Check for duplicates (same name and type within profile)
    const existingTags = await getTagsForProfile(activeProfile, type)
    if (existingTags.some((t) => t.name === trimmedName)) {
      throw new Error(
        `A tag with this name already exists for ${type} transactions`
      )
    }

    // Add to IndexedDB
    await addTagDB(activeProfile, trimmedName, type, color)

    // Reload tags
    await loadTags()
  }

  const updateTag = async (id: string, updates: Partial<Tag>) => {
    if (!activeProfile) {
      throw new Error('No active profile selected')
    }

    // Validate if name is being updated
    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim()
      if (trimmedName === '') {
        throw new Error('Tag name cannot be empty')
      }

      // Check for duplicates (excluding current tag)
      const existingTags = await getTagsForProfile(activeProfile)
      const currentTag = existingTags.find((t) => t.id === id)
      if (!currentTag) {
        throw new Error('Tag not found')
      }

      if (
        existingTags.some(
          (t) =>
            t.id !== id &&
            t.name === trimmedName &&
            t.type === currentTag.type
        )
      ) {
        throw new Error(
          `A tag with this name already exists for ${currentTag.type} transactions`
        )
      }
    }

    // Update in IndexedDB
    await updateTagDB(id, updates)

    // Reload tags
    await loadTags()
  }

  const renameTag = async (id: string, newName: string) => {
    if (!activeProfile) {
      throw new Error('No active profile selected')
    }

    // Find the tag
    const tag = tags.find((t) => t.id === id)
    if (!tag) {
      throw new Error('Tag not found')
    }

    const trimmedNewName = newName.trim()

    // Validate
    if (trimmedNewName === '') {
      throw new Error('Tag name cannot be empty')
    }

    if (trimmedNewName === tag.name) {
      throw new Error('New name must be different from current name')
    }

    // Check for duplicates
    const existingTags = await getTagsForProfile(activeProfile, tag.type)
    if (existingTags.some((t) => t.id !== id && t.name === trimmedNewName)) {
      throw new Error(
        `A tag with this name already exists for ${tag.type} transactions`
      )
    }

    // Preview rename to get affected count
    const previewResponse = await api.previewTagRename(tag.name, activeProfile)
    if (!previewResponse.success) {
      throw new Error(
        previewResponse.error?.message || 'Failed to preview tag rename'
      )
    }

    const affectedCount = previewResponse.data?.affectedCount || 0

    // If there are affected transactions, update them via API
    if (affectedCount > 0) {
      const renameResponse = await api.renameTag(
        tag.name,
        trimmedNewName,
        activeProfile
      )
      if (!renameResponse.success) {
        throw new Error(
          renameResponse.error?.message || 'Failed to rename tag'
        )
      }
    }

    // Update in IndexedDB
    await updateTagDB(id, { name: trimmedNewName })

    // Reload tags
    await loadTags()
  }

  const deleteTag = async (id: string) => {
    if (!activeProfile) {
      throw new Error('No active profile selected')
    }

    // Find the tag
    const tag = tags.find((t) => t.id === id)
    if (!tag) {
      throw new Error('Tag not found')
    }

    // Preview delete to check if tag is used
    const previewResponse = await api.previewTagDelete(tag.name, activeProfile)
    if (!previewResponse.success) {
      throw new Error(
        previewResponse.error?.message || 'Failed to preview tag delete'
      )
    }

    const affectedCount = previewResponse.data?.affectedCount || 0

    // If tag is used in transactions, block deletion
    if (affectedCount > 0) {
      throw new Error(
        `Cannot delete tag: it is used in ${affectedCount} transaction(s). Please remove the tag from all transactions before deleting it.`
      )
    }

    // Delete via API (for validation)
    const deleteResponse = await api.deleteTag(tag.name, activeProfile)
    if (!deleteResponse.success) {
      throw new Error(
        deleteResponse.error?.message || 'Failed to delete tag'
      )
    }

    // Delete from IndexedDB
    await deleteTagDB(id)

    // Reload tags
    await loadTags()
  }

  /**
   * Import tags from transactions for active profile
   */
  const importTagsFromTransactions = async (): Promise<{
    added: number
    skipped: number
  }> => {
    if (!activeProfile) {
      throw new Error('No active profile selected')
    }

    try {
      // Get all transactions for active profile
      const response = await api.getTransactions({ profile: activeProfile })
      if (!response.success || !response.data) {
        return { added: 0, skipped: 0 }
      }

      const transactions = response.data.transactions || []

      // Extract unique tags with their types
      const tagMap = new Map<string, TransactionType>()
      for (const transaction of transactions) {
        if (transaction.tags && transaction.tags.length > 0) {
          for (const tagName of transaction.tags) {
            if (tagName) {
              // Store tag with its transaction type
              // If tag appears in both expense and income, prefer expense
              if (
                !tagMap.has(tagName) ||
                transaction.type === 'expense'
              ) {
                tagMap.set(tagName, transaction.type)
              }
            }
          }
        }
      }

      // Get existing tags for this profile
      const existingTags = await getTagsForProfile(activeProfile)
      const existingTagKeys = new Set(
        existingTags.map((t) => `${t.name}:${t.type}`)
      )

      let added = 0
      let skipped = 0

      // Add new tags (skip existing)
      for (const [tagName, type] of tagMap.entries()) {
        const tagKey = `${tagName}:${type}`
        if (!existingTagKeys.has(tagKey)) {
          await addTagDB(activeProfile, tagName, type)
          added++
        } else {
          skipped++
        }
      }

      // Reload tags
      await loadTags()

      return { added, skipped }
    } catch (error) {
      console.error('Error importing tags:', error)
      throw error
    }
  }

  const refreshTags = async () => {
    await loadTags()
  }

  const clearError = () => setError(null)

  return (
    <TagContext.Provider
      value={{
        tags,
        isLoading,
        error,
        clearError,
        getTagsByType,
        addTag,
        updateTag,
        renameTag,
        deleteTag,
        refreshTags,
        importTagsFromTransactions,
      }}
    >
      {children}
    </TagContext.Provider>
  )
}

export function useTag() {
  const context = useContext(TagContext)
  if (context === undefined) {
    throw new Error('useTag must be used within a TagProvider')
  }
  return context
}

