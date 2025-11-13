'use client'

import { faker } from '@faker-js/faker'
import type {
  Transaction,
  TransactionType,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionQueryParams,
  StatisticsQueryParams,
  StatisticsData,
  TagBreakdown,
  AmountData,
  UserData,
  PreviewResponse,
} from '@/types'

/**
 * Guest Data Service
 * Generates and manages mock data for guest mode
 * All data is stored in memory and generated using Faker.js
 */
class GuestDataService {
  private transactions: Map<string, Transaction> = new Map()
  private userId: string

  constructor() {
    // Generate a consistent user ID for guest mode
    this.userId = faker.string.uuid()
    // Initialize with some fake transactions
    this.generateInitialTransactions()
  }

  /**
   * Generate initial transactions for demo
   */
  private generateInitialTransactions(): void {
    const profiles = ['Personal', 'Business', 'Family']
    const currencies = ['USD', 'EUR', 'GBP', 'JPY']
    const expenseTags = [
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Bills & Utilities',
      'Entertainment',
      'Healthcare',
      'Travel',
    ]
    const incomeTags = ['Salary', 'Freelance', 'Investment', 'Gift', 'Bonus']

    // Generate 30-50 transactions over the last 90 days
    const count = faker.number.int({ min: 30, max: 50 })
    for (let i = 0; i < count; i++) {
      const id = faker.string.uuid()
      this.transactions.set(id, this.generateTransaction(id, {
        profiles,
        currencies,
        expenseTags,
        incomeTags,
      }))
    }
  }

  /**
   * Generate a single transaction
   */
  private generateTransaction(
    id?: string,
    options?: {
      profiles?: string[]
      currencies?: string[]
      expenseTags?: string[]
      incomeTags?: string[]
    }
  ): Transaction {
    const transactionId = id || faker.string.uuid()
    const type: TransactionType = faker.helpers.arrayElement(['expense', 'income'])
    const date = faker.date.between({
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      to: new Date(),
    })

    const profiles = options?.profiles || ['Personal', 'Business']
    const currencies = options?.currencies || ['USD', 'EUR', 'GBP']
    const expenseTags = options?.expenseTags || ['Food', 'Transport', 'Shopping']
    const incomeTags = options?.incomeTags || ['Salary', 'Freelance']

    const tags =
      type === 'expense'
        ? faker.helpers.arrayElements(expenseTags, { min: 1, max: 2 })
        : faker.helpers.arrayElements(incomeTags, { min: 1, max: 1 })

    return {
      id: transactionId,
      userId: this.userId,
      profile: faker.helpers.arrayElement(profiles),
      occurredAt: date.toISOString().split('T')[0],
      amountMinor: faker.number.int({
        min: type === 'expense' ? 500 : 10000,
        max: type === 'expense' ? 50000 : 500000,
      }),
      currency: faker.helpers.arrayElement(currencies),
      type,
      tags,
      note: faker.lorem.sentence(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    }
  }

  /**
   * Simulate network delay
   */
  private async delay(ms: number = 100): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get transactions with filtering and pagination
   */
  async getTransactions(
    params: TransactionQueryParams = {}
  ): Promise<{ transactions: Transaction[]; pagination: any }> {
    await this.delay(100)

    let filtered = Array.from(this.transactions.values())

    // Filter by profile
    if (params.profile) {
      filtered = filtered.filter((t) => t.profile === params.profile)
    }

    // Filter by type
    if (params.type) {
      filtered = filtered.filter((t) => t.type === params.type)
    }

    // Filter by date range
    if (params.from) {
      filtered = filtered.filter((t) => t.occurredAt >= params.from!)
    }

    if (params.to) {
      filtered = filtered.filter((t) => t.occurredAt <= params.to!)
    }

    // Sort by date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )

    // Pagination
    const limit = params.limit || 50
    const offset = params.offset || 0
    const total = filtered.length
    const paginated = filtered.slice(offset, offset + limit)
    const hasMore = offset + limit < total

    return {
      transactions: paginated,
      pagination: {
        total,
        limit,
        offset,
        hasMore,
      },
    }
  }

  /**
   * Get a single transaction by ID
   */
  async getTransaction(id: string): Promise<Transaction | null> {
    await this.delay(50)
    return this.transactions.get(id) || null
  }

  /**
   * Create a new transaction
   */
  async createTransaction(
    data: CreateTransactionRequest
  ): Promise<{ transaction: Transaction }> {
    await this.delay(150)

    const transaction: Transaction = {
      id: faker.string.uuid(),
      userId: this.userId,
      profile: data.profile,
      occurredAt: data.occurredAt,
      amountMinor: data.amountMinor,
      currency: data.currency,
      type: data.type,
      tags: data.tags,
      note: data.note || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.transactions.set(transaction.id, transaction)

    return { transaction }
  }

  /**
   * Update an existing transaction
   */
  async updateTransaction(
    id: string,
    data: UpdateTransactionRequest
  ): Promise<{ transaction: Transaction }> {
    await this.delay(150)

    const existing = this.transactions.get(id)
    if (!existing) {
      throw new Error(`Transaction with id "${id}" not found`)
    }

    const updated: Transaction = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    }

    this.transactions.set(id, updated)

    return { transaction: updated }
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string): Promise<void> {
    await this.delay(100)

    if (!this.transactions.has(id)) {
      throw new Error(`Transaction with id "${id}" not found`)
    }

    this.transactions.delete(id)
  }

  /**
   * Get statistics for a period
   */
  async getStatistics(
    params: StatisticsQueryParams
  ): Promise<StatisticsData> {
    await this.delay(150)

    // Get all transactions matching the filters
    const allTransactions = await this.getTransactions({
      profile: params.profile,
      from: params.from,
      to: params.to,
    })

    // Filter by currency
    const filtered = allTransactions.transactions.filter(
      (t) => t.currency === params.currency
    )

    // Calculate totals
    let totalIncome = 0
    let totalExpense = 0

    const expenseByTag: Record<string, number> = {}
    const incomeByTag: Record<string, number> = {}

    for (const transaction of filtered) {
      if (transaction.type === 'expense') {
        totalExpense += transaction.amountMinor
        transaction.tags.forEach((tag) => {
          expenseByTag[tag] = (expenseByTag[tag] || 0) + transaction.amountMinor
        })
      } else {
        totalIncome += transaction.amountMinor
        transaction.tags.forEach((tag) => {
          incomeByTag[tag] = (incomeByTag[tag] || 0) + transaction.amountMinor
        })
      }
    }

    const netBalance = totalIncome - totalExpense

    // Create expense breakdown
    const expenseBreakdown: TagBreakdown[] = Object.entries(expenseByTag)
      .map(([tag, amountMinor]) => ({
        tag,
        amountMinor,
        currency: params.currency,
        percentage:
          totalExpense > 0
            ? Math.round((amountMinor / totalExpense) * 100)
            : 0,
      }))
      .sort((a, b) => b.amountMinor - a.amountMinor)

    // Create income breakdown
    const incomeBreakdown: TagBreakdown[] = Object.entries(incomeByTag)
      .map(([tag, amountMinor]) => ({
        tag,
        amountMinor,
        currency: params.currency,
        percentage:
          totalIncome > 0
            ? Math.round((amountMinor / totalIncome) * 100)
            : 0,
      }))
      .sort((a, b) => b.amountMinor - a.amountMinor)

    const summary: {
      totalIncome: AmountData
      totalExpense: AmountData
      netBalance: AmountData
    } = {
      totalIncome: {
        amountMinor: totalIncome,
        currency: params.currency,
      },
      totalExpense: {
        amountMinor: totalExpense,
        currency: params.currency,
      },
      netBalance: {
        amountMinor: netBalance,
        currency: params.currency,
      },
    }

    return {
      summary,
      expenseBreakdown,
      incomeBreakdown,
      period: {
        from: params.from,
        to: params.to,
        currency: params.currency,
      },
    }
  }

  /**
   * Get current user (mock)
   */
  async getCurrentUser(): Promise<UserData> {
    await this.delay(50)

    return {
      user: {
        id: this.userId,
        email: 'guest@example.com',
        emailVerifiedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }
  }

  /**
   * Preview rename operation (count affected transactions)
   */
  async previewRename(
    entityType: 'profile' | 'tag',
    oldName: string,
    profile?: string
  ): Promise<PreviewResponse> {
    await this.delay(50)

    let count = 0

    if (entityType === 'profile') {
      count = Array.from(this.transactions.values()).filter(
        (t) => t.profile === oldName
      ).length
    } else if (entityType === 'tag' && profile) {
      count = Array.from(this.transactions.values()).filter(
        (t) => t.profile === profile && t.tags.includes(oldName)
      ).length
    }

    return { affectedCount: count }
  }

  /**
   * Preview delete operation (check if entity is used)
   */
  async previewDelete(
    entityType: 'profile' | 'tag' | 'currency',
    name: string,
    profile?: string
  ): Promise<PreviewResponse> {
    await this.delay(50)

    let count = 0

    if (entityType === 'profile') {
      count = Array.from(this.transactions.values()).filter(
        (t) => t.profile === name
      ).length
    } else if (entityType === 'tag' && profile) {
      count = Array.from(this.transactions.values()).filter(
        (t) => t.profile === profile && t.tags.includes(name)
      ).length
    } else if (entityType === 'currency') {
      count = Array.from(this.transactions.values()).filter(
        (t) => t.currency === name
      ).length
    }

    return { affectedCount: count }
  }

  /**
   * Reset all data (for testing)
   */
  reset(): void {
    this.transactions.clear()
    this.generateInitialTransactions()
  }

  /**
   * Import transactions from CSV and replace existing data
   * Expected CSV headers: profile,occurredAt,amountMinor,currency,type,tags,note
   */
  importTransactionsFromCSV(csv: string): { imported: number } {
    this.transactions.clear()
    const lines = csv
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lines.length <= 1) {
      return { imported: 0 }
    }

    // Assume first line is header
    const header = lines[0].split(',').map((h) => h.trim())
    const colIndex: Record<string, number> = {}
    header.forEach((h, idx) => {
      colIndex[h] = idx
    })

    const required = ['profile', 'occurredAt', 'amountMinor', 'currency', 'type', 'tags', 'note']
    for (const req of required) {
      if (!(req in colIndex)) {
        // If missing columns, skip import to avoid corrupt state
        return { imported: 0 }
      }
    }

    let imported = 0
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i]
      if (!row) continue
      // Basic CSV split; export doesn't include commas inside fields
      const cols = row.split(',').map((c) => c.trim())
      try {
        const type = cols[colIndex['type']] as TransactionType
        if (type !== 'expense' && type !== 'income') continue
        const tagsStr = cols[colIndex['tags']] || ''
        const tags = tagsStr ? tagsStr.split(';').map((t) => t.trim()).filter(Boolean) : []
        const amountMinor = parseInt(cols[colIndex['amountMinor']], 10)
        if (Number.isNaN(amountMinor)) continue

        const transaction: Transaction = {
          id: faker.string.uuid(),
          userId: this.userId,
          profile: cols[colIndex['profile']],
          occurredAt: cols[colIndex['occurredAt']],
          amountMinor,
          currency: cols[colIndex['currency']].toUpperCase(),
          type,
          tags,
          note: cols[colIndex['note']] || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        this.transactions.set(transaction.id, transaction)
        imported++
      } catch {
        // Skip malformed rows
        // eslint-disable-next-line no-continue
        continue
      }
    }

    return { imported }
  }
}

// Singleton instance
export const guestDataService = new GuestDataService()

