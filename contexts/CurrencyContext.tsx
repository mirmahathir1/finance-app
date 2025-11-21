'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react'
import type { Currency, Transaction, TransactionQueryParams } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAllCurrencies,
  getCurrency,
  addCurrency as addCurrencyDB,
  updateCurrency as updateCurrencyDB,
  deleteCurrency as deleteCurrencyDB,
  setDefaultCurrency as setDefaultCurrencyDB,
} from '@/utils/indexedDB'
import { useApi } from '@/utils/useApi'
import { getFriendlyErrorMessage } from '@/utils/error'

interface CurrencyContextType {
  currencies: Currency[]
  defaultCurrency: Currency | null
  isLoading: boolean
  error: string | null
  clearError: () => void
  addCurrency: (code: string, isDefault?: boolean) => Promise<void>
  updateCurrency: (code: string, updates: Partial<Currency>) => Promise<void>
  deleteCurrency: (code: string, options?: { skipUsageCheck?: boolean }) => Promise<void>
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
  const { user, isGuestMode, isLoading: authLoading } = useAuth()
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [defaultCurrency, setDefaultCurrency] = useState<Currency | null>(null)
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
    if (authLoading) {
      return
    }

    // When fully signed out (non-guest), ensure state is cleared without hitting the API
    if (authStateKey === 'signed-out') {
      setCurrencies([])
      setDefaultCurrency(null)
      setError(null)
      setIsLoading(false)
      return
    }

    // When a user (or guest) is available, reload currencies
    loadCurrencies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStateKey, authLoading])

  const loadCurrencies = async (options: { showLoader?: boolean } = {}) => {
    const { showLoader = true } = options
    try {
      activeLoadCountRef.current += 1
      if (showLoader) {
        setIsLoading(true)
      }
      setError(null)
      const allCurrencies = await getAllCurrencies()
      setCurrencies(allCurrencies)
      const defaultEntry =
        allCurrencies.find((currency) => currency.isDefault) || null
      setDefaultCurrency(defaultEntry)
    } catch (error) {
      console.error('Error loading currencies:', error)
      setError(getFriendlyErrorMessage(error, 'Failed to load currencies.'))
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
    await loadCurrencies({ showLoader: false })
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
    await loadCurrencies({ showLoader: false })
  }

  /**
   * Delete a currency (only if not used in transactions)
   */
  const deleteCurrency = async (code: string, options: { skipUsageCheck?: boolean } = {}) => {
    const { skipUsageCheck = false } = options
    const normalizedCode = code.trim().toUpperCase()

    const existing = await getCurrency(normalizedCode)
    if (!existing) {
      throw new Error(`Currency "${normalizedCode}" not found`)
    }

    if (!skipUsageCheck) {
      const usageCount = await countTransactions({ currency: normalizedCode })
      if (usageCount > 0) {
        throw new Error(
          `Cannot delete currency "${normalizedCode}" because it is used in ${usageCount} transaction(s)`
        )
      }
    }

    // Delete from IndexedDB
    await deleteCurrencyDB(normalizedCode)

    // Reload currencies
    await loadCurrencies({ showLoader: false })
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
    await loadCurrencies({ showLoader: false })
  }

  /**
   * Import currencies from transactions
   */
  const importCurrenciesFromTransactions = async (): Promise<{ added: number; skipped: number }> => {
    const transactions = await fetchTransactions()
    
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
    await loadCurrencies({ showLoader: false })

    return { added, skipped }
  }

  /**
   * Refresh currencies from IndexedDB
   */
  const refreshCurrencies = async () => {
    await loadCurrencies({ showLoader: false })
  }

  const clearError = () => setError(null)

  return (
    <CurrencyContext.Provider
      value={{
        currencies,
        defaultCurrency,
        isLoading,
        error,
        clearError,
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

