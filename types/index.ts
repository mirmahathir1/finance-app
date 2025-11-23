// ============================================================================
// Core Data Types
// ============================================================================

/**
 * Transaction type - either expense or income
 */
export type TransactionType = 'expense' | 'income'

/**
 * User interface (from PostgreSQL)
 */
export interface User {
  id: string
  email: string
  passwordHash: string
  emailVerifiedAt?: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Transaction interface (from PostgreSQL)
 */
export interface Transaction {
  id: string
  userId: string
  profile: string // Profile name (stored as text)
  occurredAt: string // YYYY-MM-DD format
  amountMinor: number // Integer minor units (e.g., 10000 = $100.00)
  currency: string // 3-letter currency code (e.g., "USD", "EUR")
  type: TransactionType
  tags: string[] // Tag names (stored as text array)
  note?: string | null
  createdAt: string
  updatedAt: string
}

// ============================================================================
// IndexedDB Types
// ============================================================================

/**
 * Profile interface (stored in IndexedDB)
 */
export interface Profile {
  name: string // Primary key
  createdAt: string
  updatedAt: string
}

/**
 * Tag interface (stored in IndexedDB)
 */
export interface Tag {
  id: string // Primary key, unique ID
  name: string // Tag name
  profile: string // Profile name
  type: TransactionType
  createdAt: string
  updatedAt: string
}

/**
 * Currency interface (stored in IndexedDB)
 */
export interface Currency {
  code: string // Primary key, e.g., "USD", "EUR", "GBP"
  isDefault: boolean // Whether this is the default currency
  createdAt: string
  updatedAt: string
}

/**
 * App settings interface (stored in IndexedDB)
 */
export interface AppSettings {
  key: string // Primary key (e.g., "defaultCurrency", "activeProfile")
  value: string // Setting value
  updatedAt: string
}

// ============================================================================
// API Request Types
// ============================================================================

/**
 * Create transaction request
 */
export interface CreateTransactionRequest {
  profile: string
  occurredAt: string // YYYY-MM-DD format
  amountMinor: number
  currency: string
  type: TransactionType
  tags: string[]
  note?: string
}

/**
 * Update transaction request
 */
export interface UpdateTransactionRequest {
  profile?: string
  occurredAt?: string // YYYY-MM-DD format
  amountMinor?: number
  currency?: string
  type?: TransactionType
  tags?: string[]
  note?: string | null
}

/**
 * Transaction query parameters
 */
export interface TransactionQueryParams {
  profile?: string
  from?: string // YYYY-MM-DD format
  to?: string // YYYY-MM-DD format
  type?: TransactionType
  currency?: string
  tag?: string
  limit?: number
  offset?: number
}

/**
 * Statistics query parameters
 */
export interface StatisticsQueryParams {
  profile: string
  from: string // YYYY-MM-DD format
  to: string // YYYY-MM-DD format
  currency: string
  includeConverted?: boolean
}

/**
 * Login request
 */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * Sign up request
 */
export interface SignUpRequest {
  email: string
}

/**
 * Set password request
 */
export interface SetPasswordRequest {
  token: string
  password: string
}

/**
 * Forgot password request
 */
export interface ForgotPasswordRequest {
  email: string
}

/**
 * Reset password request
 */
export interface ResetPasswordRequest {
  token: string
  password: string
}

/**
 * Verify email request
 */
export interface VerifyEmailRequest {
  token: string
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API success response wrapper
 */
export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code?: string
  }
}

/**
 * API response type (union of success and error)
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Pagination metadata
 */
export interface Pagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

/**
 * Transactions list response data
 */
export interface TransactionsListData {
  transactions: Transaction[]
  pagination: Pagination
}

/**
 * Single transaction response data
 */
export interface TransactionData {
  transaction: Transaction
}

/**
 * Statistics summary amounts
 */
export interface AmountData {
  amountMinor: number
  currency: string
}

/**
 * Statistics summary
 */
export interface StatisticsSummary {
  totalIncome: AmountData
  totalExpense: AmountData
  netBalance: AmountData
}

/**
 * Tag breakdown item
 */
export interface TagBreakdown {
  tag: string
  amountMinor: number
  currency: string
  percentage: number
}

/**
 * Statistics response data
 */
export interface StatisticsData {
  summary: StatisticsSummary
  expenseBreakdown: TagBreakdown[]
  incomeBreakdown: TagBreakdown[]
  period: {
    from: string
    to: string
    currency: string
  }
  meta?: {
    skippedCurrencies?: string[]
  }
}

/**
 * User response data (without password hash)
 */
export interface UserData {
  user: Omit<User, 'passwordHash'>
}

/**
 * Preview response for rename/delete operations
 */
export interface PreviewResponse {
  affectedCount: number
}

/**
 * Setup catalog summary structures
 */
export interface SetupCatalogProfile {
  name: string
  count: number
}

export interface SetupCatalogCurrency {
  code: string
  count: number
}

export interface SetupCatalogTag {
  profile: string
  name: string
  type: TransactionType
  count: number
}

export interface SetupCatalogData {
  transactionCount: number
  profiles: SetupCatalogProfile[]
  currencies: SetupCatalogCurrency[]
  tags: SetupCatalogTag[]
}

// ============================================================================
// Form Types
// ============================================================================

/**
 * Transaction form data (for create/edit forms)
 */
export interface TransactionFormData {
  type: TransactionType
  occurredAt: Date | string
  amount: number // Display amount (e.g., 100.00)
  amountMinor: number // Stored amount in minor units (e.g., 10000)
  currency: string
  description: string
  tags: string[]
  note?: string
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Date range for filtering
 */
export interface DateRange {
  from: string // YYYY-MM-DD format
  to: string // YYYY-MM-DD format
}

/**
 * Month and year selection
 */
export interface MonthYear {
  year: number
  month: number // 1-12
}

/**
 * Currency amount display
 */
export interface CurrencyAmount {
  amount: number // Display amount
  amountMinor: number // Stored amount in minor units
  currency: string
}

// ============================================================================
// Guest Mode Types
// ============================================================================

/**
 * Guest mode state
 */
export interface GuestModeState {
  isGuestMode: boolean
}

