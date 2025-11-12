'use client'

import type { Profile, Tag, Currency, AppSettings } from '@/types'

// ============================================================================
// Database Configuration
// ============================================================================

const DB_NAME = 'FinanceAppDB'
const DB_VERSION = 1

// Object store names
const STORE_PROFILES = 'profiles'
const STORE_TAGS = 'tags'
const STORE_CURRENCIES = 'currencies'
const STORE_SETTINGS = 'settings'
const STORE_GUEST_MODE = 'guestMode'

// ============================================================================
// Database Initialization
// ============================================================================

/**
 * Initialize IndexedDB database
 * Creates all object stores if they don't exist
 */
export async function initDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB is only available in the browser')
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(request.error)
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create profiles store
      if (!db.objectStoreNames.contains(STORE_PROFILES)) {
        db.createObjectStore(STORE_PROFILES, { keyPath: 'name' })
      }

      // Create tags store
      if (!db.objectStoreNames.contains(STORE_TAGS)) {
        const tagsStore = db.createObjectStore(STORE_TAGS, { keyPath: 'id' })
        // Create index on (profile, name) for uniqueness within profile
        tagsStore.createIndex('profile_name', ['profile', 'name'], {
          unique: true,
        })
        // Create index on profile for filtering
        tagsStore.createIndex('profile', 'profile', { unique: false })
      }

      // Create currencies store
      if (!db.objectStoreNames.contains(STORE_CURRENCIES)) {
        db.createObjectStore(STORE_CURRENCIES, { keyPath: 'code' })
      }

      // Create settings store
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' })
      }

      // Create guest mode store
      if (!db.objectStoreNames.contains(STORE_GUEST_MODE)) {
        db.createObjectStore(STORE_GUEST_MODE, { keyPath: 'key' })
      }
    }
  })
}

// ============================================================================
// Profile Operations
// ============================================================================

/**
 * Get all profiles
 */
export async function getAllProfiles(): Promise<Profile[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PROFILES], 'readonly')
    const store = transaction.objectStore(STORE_PROFILES)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

/**
 * Get a profile by name
 */
export async function getProfile(name: string): Promise<Profile | null> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PROFILES], 'readonly')
    const store = transaction.objectStore(STORE_PROFILES)
    const request = store.get(name)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || null)
  })
}

/**
 * Add a new profile
 */
export async function addProfile(name: string): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PROFILES], 'readwrite')
    const store = transaction.objectStore(STORE_PROFILES)

    const profile: Profile = {
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const request = store.add(profile)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Update a profile
 */
export async function updateProfile(
  name: string,
  updates: Partial<Profile>
): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PROFILES], 'readwrite')
    const store = transaction.objectStore(STORE_PROFILES)
    const getRequest = store.get(name)

    getRequest.onerror = () => reject(getRequest.error)
    getRequest.onsuccess = () => {
      const profile = getRequest.result
      if (!profile) {
        reject(new Error(`Profile "${name}" not found`))
        return
      }

      const updated: Profile = {
        ...profile,
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      const putRequest = store.put(updated)
      putRequest.onerror = () => reject(putRequest.error)
      putRequest.onsuccess = () => resolve()
    }
  })
}

/**
 * Delete a profile
 */
export async function deleteProfile(name: string): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PROFILES], 'readwrite')
    const store = transaction.objectStore(STORE_PROFILES)
    const request = store.delete(name)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// ============================================================================
// Tag Operations
// ============================================================================

/**
 * Get all tags for a profile
 */
export async function getTagsForProfile(
  profileName: string,
  type?: 'expense' | 'income'
): Promise<Tag[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TAGS], 'readonly')
    const store = transaction.objectStore(STORE_TAGS)
    const index = store.index('profile')
    const request = index.getAll(profileName)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      let tags = request.result || []
      if (type) {
        tags = tags.filter((tag) => tag.type === type)
      }
      resolve(tags)
    }
  })
}

/**
 * Get a tag by ID
 */
export async function getTag(id: string): Promise<Tag | null> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TAGS], 'readonly')
    const store = transaction.objectStore(STORE_TAGS)
    const request = store.get(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || null)
  })
}

/**
 * Add a new tag
 */
export async function addTag(
  profile: string,
  name: string,
  type: 'expense' | 'income',
  color?: string
): Promise<Tag> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TAGS], 'readwrite')
    const store = transaction.objectStore(STORE_TAGS)

    const tag: Tag = {
      id: crypto.randomUUID(),
      name,
      profile,
      type,
      color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const request = store.add(tag)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(tag)
  })
}

/**
 * Update a tag
 */
export async function updateTag(
  id: string,
  updates: Partial<Tag>
): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TAGS], 'readwrite')
    const store = transaction.objectStore(STORE_TAGS)
    const getRequest = store.get(id)

    getRequest.onerror = () => reject(getRequest.error)
    getRequest.onsuccess = () => {
      const tag = getRequest.result
      if (!tag) {
        reject(new Error(`Tag with id "${id}" not found`))
        return
      }

      const updated: Tag = {
        ...tag,
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      const putRequest = store.put(updated)
      putRequest.onerror = () => reject(putRequest.error)
      putRequest.onsuccess = () => resolve()
    }
  })
}

/**
 * Delete a tag
 */
export async function deleteTag(id: string): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TAGS], 'readwrite')
    const store = transaction.objectStore(STORE_TAGS)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// ============================================================================
// Currency Operations
// ============================================================================

/**
 * Get all currencies
 */
export async function getAllCurrencies(): Promise<Currency[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_CURRENCIES], 'readonly')
    const store = transaction.objectStore(STORE_CURRENCIES)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

/**
 * Get a currency by code
 */
export async function getCurrency(code: string): Promise<Currency | null> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_CURRENCIES], 'readonly')
    const store = transaction.objectStore(STORE_CURRENCIES)
    const request = store.get(code.toUpperCase())

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || null)
  })
}

/**
 * Add a new currency
 */
export async function addCurrency(
  code: string,
  isDefault = false
): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_CURRENCIES], 'readwrite')
    const store = transaction.objectStore(STORE_CURRENCIES)

    const currency: Currency = {
      code: code.toUpperCase(),
      isDefault,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const request = store.add(currency)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Update a currency
 */
export async function updateCurrency(
  code: string,
  updates: Partial<Currency>
): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_CURRENCIES], 'readwrite')
    const store = transaction.objectStore(STORE_CURRENCIES)
    const getRequest = store.get(code.toUpperCase())

    getRequest.onerror = () => reject(getRequest.error)
    getRequest.onsuccess = () => {
      const currency = getRequest.result
      if (!currency) {
        reject(new Error(`Currency "${code}" not found`))
        return
      }

      const updated: Currency = {
        ...currency,
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      const putRequest = store.put(updated)
      putRequest.onerror = () => reject(putRequest.error)
      putRequest.onsuccess = () => resolve()
    }
  })
}

/**
 * Delete a currency
 */
export async function deleteCurrency(code: string): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_CURRENCIES], 'readwrite')
    const store = transaction.objectStore(STORE_CURRENCIES)
    const request = store.delete(code.toUpperCase())

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Get default currency
 */
export async function getDefaultCurrency(): Promise<Currency | null> {
  const currencies = await getAllCurrencies()
  return currencies.find((c) => c.isDefault) || null
}

/**
 * Set default currency (unset others)
 */
export async function setDefaultCurrency(code: string): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_CURRENCIES], 'readwrite')
    const store = transaction.objectStore(STORE_CURRENCIES)
    const getAllRequest = store.getAll()

    getAllRequest.onerror = () => reject(getAllRequest.error)
    getAllRequest.onsuccess = () => {
      const currencies = getAllRequest.result || []
      const promises: Promise<void>[] = []

      // Unset all default flags
      for (const currency of currencies) {
        if (currency.isDefault && currency.code !== code.toUpperCase()) {
          currency.isDefault = false
          currency.updatedAt = new Date().toISOString()
          promises.push(
            new Promise((res, rej) => {
              const req = store.put(currency)
              req.onerror = () => rej(req.error)
              req.onsuccess = () => res()
            })
          )
        }
      }

      // Set new default
      const targetCurrency = currencies.find(
        (c) => c.code === code.toUpperCase()
      )
      if (targetCurrency) {
        targetCurrency.isDefault = true
        targetCurrency.updatedAt = new Date().toISOString()
        promises.push(
          new Promise((res, rej) => {
            const req = store.put(targetCurrency)
            req.onerror = () => rej(req.error)
            req.onsuccess = () => res()
          })
        )
      } else {
        reject(new Error(`Currency "${code}" not found`))
        return
      }

      Promise.all(promises)
        .then(() => resolve())
        .catch(reject)
    }
  })
}

// ============================================================================
// Settings Operations
// ============================================================================

/**
 * Get a setting by key
 */
export async function getSetting(key: string): Promise<string | null> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SETTINGS], 'readonly')
    const store = transaction.objectStore(STORE_SETTINGS)
    const request = store.get(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = request.result
      resolve(result ? result.value : null)
    }
  })
}

/**
 * Set a setting
 */
export async function setSetting(key: string, value: string): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SETTINGS], 'readwrite')
    const store = transaction.objectStore(STORE_SETTINGS)

    const setting: AppSettings = {
      key,
      value,
      updatedAt: new Date().toISOString(),
    }

    const request = store.put(setting)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Delete a setting
 */
export async function deleteSetting(key: string): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SETTINGS], 'readwrite')
    const store = transaction.objectStore(STORE_SETTINGS)
    const request = store.delete(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Get active profile
 */
export async function getActiveProfile(): Promise<string | null> {
  return getSetting('activeProfile')
}

/**
 * Set active profile
 */
export async function setActiveProfile(profileName: string): Promise<void> {
  return setSetting('activeProfile', profileName)
}

// ============================================================================
// Guest Mode Operations
// ============================================================================

/**
 * Get guest mode state
 */
export async function getGuestModeState(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_GUEST_MODE], 'readonly')
      const store = transaction.objectStore(STORE_GUEST_MODE)
      const request = store.get('isGuestMode')

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.value === true : false)
      }
    })
  } catch (error) {
    console.error('Error reading guest mode state from IndexedDB:', error)
    return false
  }
}

/**
 * Set guest mode state
 */
export async function setGuestModeState(value: boolean): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_GUEST_MODE], 'readwrite')
      const store = transaction.objectStore(STORE_GUEST_MODE)
      const request = store.put({
        key: 'isGuestMode',
        value,
        updatedAt: new Date().toISOString(),
      })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    console.error('Error writing guest mode state to IndexedDB:', error)
    throw error
  }
}

/**
 * Clear guest mode state
 */
export async function clearGuestModeState(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_GUEST_MODE], 'readwrite')
      const store = transaction.objectStore(STORE_GUEST_MODE)
      const request = store.delete('isGuestMode')

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    console.error('Error clearing guest mode state from IndexedDB:', error)
    throw error
  }
}

/**
 * Clear all data from IndexedDB
 * This removes all profiles, tags, currencies, settings, and guest mode state
 */
export async function clearAllData(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const db = await initDB()
    
    // Clear all object stores
    const stores = [
      STORE_PROFILES,
      STORE_TAGS,
      STORE_CURRENCIES,
      STORE_SETTINGS,
      STORE_GUEST_MODE,
    ]

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(stores, 'readwrite')
      let completed = 0
      let hasError = false

      stores.forEach((storeName) => {
        const store = transaction.objectStore(storeName)
        const clearRequest = store.clear()

        clearRequest.onerror = () => {
          if (!hasError) {
            hasError = true
            reject(clearRequest.error)
          }
        }

        clearRequest.onsuccess = () => {
          completed++
          if (completed === stores.length && !hasError) {
            resolve()
          }
        }
      })
    })
  } catch (error) {
    console.error('Error clearing all data from IndexedDB:', error)
    throw error
  }
}

