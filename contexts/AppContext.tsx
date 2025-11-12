'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getSetting, setSetting } from '@/utils/indexedDB'

interface AppContextType {
  dateFormat: string
  isLoading: boolean
  setDateFormat: (format: string) => Promise<void>
  refreshSettings: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Default date format
const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD'

// Valid date formats
export const VALID_DATE_FORMATS = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
] as const

export function AppProvider({ children }: { children: ReactNode }) {
  const [dateFormat, setDateFormatState] = useState<string>(DEFAULT_DATE_FORMAT)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Load settings from IndexedDB
   */
  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const savedDateFormat = await getSetting('dateFormat')
      if (savedDateFormat) {
        setDateFormatState(savedDateFormat)
      } else {
        // Set default if not found
        setDateFormatState(DEFAULT_DATE_FORMAT)
      }
    } catch (error) {
      console.error('Error loading app settings:', error)
      // Use default on error
      setDateFormatState(DEFAULT_DATE_FORMAT)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Set date format and save to IndexedDB
   */
  const setDateFormat = async (format: string) => {
    // Validate format
    const validFormats = VALID_DATE_FORMATS.map((f) => f.value) as readonly string[]
    if (!validFormats.includes(format)) {
      throw new Error(`Invalid date format: "${format}". Must be one of: ${validFormats.join(', ')}`)
    }

    try {
      // Save to IndexedDB
      await setSetting('dateFormat', format)
      // Update state
      setDateFormatState(format)
    } catch (error) {
      console.error('Error saving date format:', error)
      throw error
    }
  }

  /**
   * Refresh settings from IndexedDB
   */
  const refreshSettings = async () => {
    await loadSettings()
  }

  return (
    <AppContext.Provider
      value={{
        dateFormat,
        isLoading,
        setDateFormat,
        refreshSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

