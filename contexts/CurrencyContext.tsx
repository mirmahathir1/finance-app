'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Currency } from '@/types'
import {
  getAllCurrencies,
  getCurrency,
  getDefaultCurrency,
  addCurrency as addCurrencyDB,
  updateCurrency as updateCurrencyDB,
  deleteCurrency as deleteCurrencyDB,
  setDefaultCurrency as setDefaultCurrencyDB,
} from '@/utils/indexedDB'
import { useApi } from '@/utils/useApi'

interface CurrencyContextType {
  currencies: Currency[]
  defaultCurrency: Currency | null
  isLoading: boolean
  addCurrency: (code: string, isDefault?: boolean) => Promise<void>
  updateCurrency: (code: string, updates: Partial<Currency>) => Promise<void>
  deleteCurrency: (code: string) => Promise<void>
  setDefaultCurrency: (code: string) => Promise<void>
  refreshCurrencies: () => Promise<void>
  importCurrenciesFromTransactions: () => Promise<{ added: number; skipped: number }>
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

/**
 * Validate currency code format (ISO 4217: 3 uppercase letters)
 */
function validateCurrencyCode(code: string): void {
  if (!code || code.trim().length === 0) {
    throw new Error('Currency code cannot be empty')
  }
  const normalized = code.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new Error('Currency code must be exactly 3 uppercase letters (ISO 4217 format)')
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const api = useApi()
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [defaultCurrency, setDefaultCurrency] = useState<Currency | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCurrencies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadCurrencies = async () => {
    try {
      setIsLoading(true)
      const allCurrencies = await getAllCurrencies()
      const defaultCurr = await getDefaultCurrency()
      setCurrencies(allCurrencies)
      setDefaultCurrency(defaultCurr)
    } catch (error) {
      console.error('Error loading currencies:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Add a new currency
   */
  const addCurrency = async (code: string, isDefault = false) => {
    // Validate currency code
    validateCurrencyCode(code)
    const normalizedCode = code.trim().toUpperCase()

    // Check for duplicates
    const existing = await getCurrency(normalizedCode)
    if (existing) {
      throw new Error(`Currency "${normalizedCode}" already exists`)
    }

    // First, add the currency
    await addCurrencyDB(normalizedCode, isDefault)

    // If setting as default, unset other defaults
    // This ensures all other currencies have isDefault = false
    if (isDefault) {
      await setDefaultCurrencyDB(normalizedCode)
    }

    // Reload currencies
    await loadCurrencies()
  }

  /**
   * Update a currency
   */
  const updateCurrency = async (
    code: string,
    updates: Partial<Currency>
  ) => {
    const normalizedCode = code.trim().toUpperCase()
    const existing = await getCurrency(normalizedCode)
    if (!existing) {
      throw new Error(`Currency "${normalizedCode}" not found`)
    }

    // If updating the code, we need to delete old and create new
    // (because code is the primary key in IndexedDB)
    if (updates.code) {
      validateCurrencyCode(updates.code)
      const newCode = updates.code.trim().toUpperCase()
      
      // Check if new code already exists (and it's different from current)
      if (newCode !== normalizedCode) {
        const duplicate = await getCurrency(newCode)
        if (duplicate) {
          throw new Error(`Currency "${newCode}" already exists`)
        }

        // Delete old currency and create new one with updated code
        const updatedCurrency: Currency = {
          ...existing,
          ...updates,
          code: newCode,
          updatedAt: new Date().toISOString(),
        }

        await deleteCurrencyDB(normalizedCode)
        await addCurrencyDB(newCode, updatedCurrency.isDefault)
        
        // If it was default, set the new one as default
        if (existing.isDefault) {
          await setDefaultCurrencyDB(newCode)
        }
      } else {
        // Code unchanged, just update other properties
        await updateCurrencyDB(normalizedCode, updates)
      }
    } else {
      // Not updating code, just update other properties
      // If setting as default, unset other defaults first
      if (updates.isDefault === true) {
        await setDefaultCurrencyDB(normalizedCode)
      } else {
        await updateCurrencyDB(normalizedCode, updates)
      }
    }

    // Reload currencies
    await loadCurrencies()
  }

  /**
   * Delete a currency (only if not used in transactions)
   */
  const deleteCurrency = async (code: string) => {
    const normalizedCode = code.trim().toUpperCase()
    const existing = await getCurrency(normalizedCode)
    if (!existing) {
      throw new Error(`Currency "${normalizedCode}" not found`)
    }

    // Check if currency is used in transactions
    const response = await api.getTransactions({})
    if (response.success && response.data) {
      const transactions = response.data.transactions || []
      const isUsed = transactions.some((t) => t.currency === normalizedCode)
      
      if (isUsed) {
        throw new Error(`Cannot delete currency "${normalizedCode}" because it is used in transactions`)
      }
    }

    // Delete from IndexedDB
    await deleteCurrencyDB(normalizedCode)

    // Reload currencies
    await loadCurrencies()
  }

  /**
   * Set default currency
   */
  const setDefaultCurrencyHandler = async (code: string) => {
    const normalizedCode = code.trim().toUpperCase()
    const existing = await getCurrency(normalizedCode)
    if (!existing) {
      throw new Error(`Currency "${normalizedCode}" not found`)
    }

    await setDefaultCurrencyDB(normalizedCode)
    await loadCurrencies()
  }

  /**
   * Import currencies from transactions
   */
  const importCurrenciesFromTransactions = async (): Promise<{ added: number; skipped: number }> => {
    // Fetch all transactions
    const response = await api.getTransactions({})
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch transactions')
    }

    const transactions = response.data.transactions || []
    
    // Extract unique currencies from transactions
    const currencySet = new Set<string>()
    for (const transaction of transactions) {
      if (transaction.currency) {
        currencySet.add(transaction.currency.toUpperCase())
      }
    }

    // Get existing currencies
    const existingCurrencies = await getAllCurrencies()
    const existingCodes = new Set(existingCurrencies.map((c) => c.code))

    // Add new currencies (skip existing)
    let added = 0
    let skipped = 0

    for (const currencyCode of currencySet) {
      if (existingCodes.has(currencyCode)) {
        skipped++
      } else {
        try {
          await addCurrencyDB(currencyCode, false)
          added++
        } catch (error) {
          console.error(`Error adding currency "${currencyCode}":`, error)
          skipped++
        }
      }
    }

    // Reload currencies
    await loadCurrencies()

    return { added, skipped }
  }

  /**
   * Refresh currencies from IndexedDB
   */
  const refreshCurrencies = async () => {
    await loadCurrencies()
  }

  return (
    <CurrencyContext.Provider
      value={{
        currencies,
        defaultCurrency,
        isLoading,
        addCurrency,
        updateCurrency,
        deleteCurrency,
        setDefaultCurrency: setDefaultCurrencyHandler,
        refreshCurrencies,
        importCurrenciesFromTransactions,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

