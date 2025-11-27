'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Tag, TransactionType, Transaction, TransactionQueryParams } from '@/types'
import {
  getTagsForProfile,
  addTag as addTagDB,
  updateTag as updateTagDB,
  deleteTag as deleteTagDB,
} from '@/utils/indexedDB'
import { useProfile } from './ProfileContext'
import { useApi } from '@/utils/useApi'
import { getFriendlyErrorMessage } from '@/utils/error'

interface DeleteTagOptions {
  skipPreview?: boolean
  affectedCount?: number
}

interface TagContextType {
  tags: Tag[]
  isLoading: boolean
  error: string | null
  clearError: () => void
  getTagsByType: (type: TransactionType) => Tag[]
  addTag: (
    name: string,
    type: TransactionType
  ) => Promise<void>
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>
  renameTag: (id: string, newName: string) => Promise<void>
  changeTagType: (id: string, newType: TransactionType) => Promise<void>
  deleteTag: (id: string, options?: DeleteTagOptions) => Promise<void>
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

  const TRANSACTION_PAGE_SIZE = 200

  const countTransactions = async (
    params: TransactionQueryParams
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
    params: TransactionQueryParams
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
      results.push(...(response.data.transactions ?? []))
      hasMore = response.data.pagination?.hasMore ?? false
      offset += TRANSACTION_PAGE_SIZE
      if (!hasMore) {
        break
      }
    }

    return results
  }

  useEffect(() => {
    if (activeProfile) {
      loadTags()
    } else {
      setTags([])
      setIsLoading(false)
      setError(null)
    }
  }, [activeProfile])

  const loadTags = async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    if (!activeProfile) return

    try {
      if (!silent) {
        setIsLoading(true)
      }
      setError(null)
      const profileTags = await getTagsForProfile(activeProfile)
      setTags(profileTags)
    } catch (error) {
      setError(getFriendlyErrorMessage(error, 'Failed to load tags.'))
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }

  const getTagsByType = (type: TransactionType): Tag[] => {
    return tags.filter((tag) => tag.type === type)
  }

  const addTag = async (
    name: string,
    type: TransactionType
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
    await addTagDB(activeProfile, trimmedName, type)

    // Reload tags
    await loadTags({ silent: true })
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
    await loadTags({ silent: true })
  }

  const renameTag = async (id: string, newName: string) => {
    if (!activeProfile) {
      throw new Error('No active profile selected')
    }

    const tag = tags.find((t) => t.id === id)
    if (!tag) {
      throw new Error('Tag not found')
    }

    const trimmedNewName = newName.trim()
    if (trimmedNewName === '') {
      throw new Error('Tag name cannot be empty')
    }
    if (trimmedNewName === tag.name) {
      throw new Error('New name must be different from current name')
    }

    const existingTags = await getTagsForProfile(activeProfile, tag.type)
    if (
      existingTags.some(
        (t) => t.id !== id && t.name.toLowerCase() === trimmedNewName.toLowerCase()
      )
    ) {
      throw new Error(
        `A tag with this name already exists for ${tag.type} transactions`
      )
    }

    // Update all transactions with the old tag name in a single database query
    const response = await api.bulkUpdateTransactionsTag(activeProfile, tag.name, {
      newTagName: trimmedNewName,
    })

    if (!response.success) {
      throw new Error(
        response.error?.message || 'Failed to update transactions'
      )
    }

    await updateTagDB(id, { name: trimmedNewName })
    await loadTags({ silent: true })
  }

  const changeTagType = async (id: string, newType: TransactionType) => {
    if (!activeProfile) {
      throw new Error('No active profile selected')
    }

    const tag = tags.find((t) => t.id === id)
    if (!tag) {
      throw new Error('Tag not found')
    }
    if (newType === tag.type) {
      throw new Error('New type must be different from current type')
    }

    // Check for duplicates with the new type
    const existingTags = await getTagsForProfile(activeProfile, newType)
    if (
      existingTags.some(
        (t) => t.id !== id && t.name.toLowerCase() === tag.name.toLowerCase()
      )
    ) {
      throw new Error(
        `A tag with this name already exists for ${newType} transactions`
      )
    }

    // Update all transactions with this tag in a single database query
    const response = await api.bulkUpdateTransactionsTag(activeProfile, tag.name, {
      newTransactionType: newType,
    })

    if (!response.success) {
      throw new Error(
        response.error?.message || 'Failed to update transactions'
      )
    }

    // Update the tag type in IndexedDB
    await updateTagDB(id, { type: newType })
    await loadTags({ silent: true })
  }

  const deleteTag = async (id: string, options?: DeleteTagOptions) => {
    if (!activeProfile) {
      throw new Error('No active profile selected')
    }

    // Find the tag
    const tag = tags.find((t) => t.id === id)
    if (!tag) {
      throw new Error('Tag not found')
    }

    let affectedCount = options?.affectedCount ?? null

    if (affectedCount === null) {
      affectedCount = await countTransactions({
        profile: activeProfile,
        tag: tag.name,
      })
    }

    // If tag is used in transactions, block deletion
    if (affectedCount > 0) {
      throw new Error(
        `Cannot delete tag: it is used in ${affectedCount} transaction(s). Please remove the tag from all transactions before deleting it.`
      )
    }

    // Delete from IndexedDB (no API call required once validated)
    await deleteTagDB(id)

    // Reload tags
    await loadTags({ silent: true })
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
      const transactions = await fetchTransactions({ profile: activeProfile })

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
        changeTagType,
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

