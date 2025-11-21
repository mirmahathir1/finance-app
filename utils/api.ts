'use client'

import { guestDataService } from '@/services/guestDataService'
import { getGuestModeState } from '@/utils/indexedDB'
import type {
  ApiResponse,
  TransactionsListData,
  TransactionData,
  StatisticsData,
  UserData,
  PreviewResponse,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionQueryParams,
  StatisticsQueryParams,
  TransactionType,
  SetupCatalogData,
} from '@/types'
import { summarizeCatalog } from '@/lib/catalog-summary'
import { getFriendlyErrorMessage, isNetworkError } from '@/utils/error'

const GUEST_ROUTE_DELAY_MS = 2000
const FORCE_GUEST_MODE =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_FORCE_GUEST_MODE === 'true'

/**
 * Simulate backend latency for guest routes
 */
async function simulateGuestRouteDelay(
  delayMs: number = GUEST_ROUTE_DELAY_MS
): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

/**
 * Check if guest mode is active
 */
async function isGuestMode(): Promise<boolean> {
  if (FORCE_GUEST_MODE) return true
  if (typeof window === 'undefined') return false
  return await getGuestModeState()
}

/**
 * Parse request body
 */
function parseBody(body: BodyInit | null | undefined): any {
  if (!body) return {}
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return {}
    }
  }
  return {}
}

/**
 * Extract path parameters from URL
 */
function extractPathParams(path: string, pattern: string): Record<string, string> {
  const params: Record<string, string> = {}
  const pathParts = path.split('/').filter(Boolean)
  const patternParts = pattern.split('/').filter(Boolean)

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      const paramName = patternParts[i].slice(1)
      params[paramName] = pathParts[i] || ''
    }
  }

  return params
}

/**
 * Handle guest mode API requests
 */
async function handleGuestModeRequest(
  endpoint: string,
  options?: RequestInit
): Promise<any> {
  await simulateGuestRouteDelay()
  const method = options?.method || 'GET'
  const url = new URL(endpoint, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  const path = url.pathname
  const searchParams = Object.fromEntries(url.searchParams)
  const body = parseBody(options?.body)

  // ============================================================================
  // Setup Endpoints
  // ============================================================================

  if (path === '/api/setup/catalog' && method === 'GET') {
    const limit = 500
    let offset = 0
    let hasMore = true
    const transactions: TransactionsListData['transactions'] = []

    while (hasMore) {
      const batch = await guestDataService.getTransactions({ limit, offset })
      transactions.push(...(batch.transactions || []))
      hasMore = Boolean(batch.pagination?.hasMore)
      offset += limit
      if (!hasMore) {
        break
      }
    }

    const catalog = summarizeCatalog(
      transactions.map((transaction) => ({
        profile: transaction.profile,
        currency: transaction.currency,
        type: transaction.type,
        tags: transaction.tags,
      }))
    )

    return {
      success: true,
      data: { catalog },
    }
  }

  // ============================================================================
  // Transaction Endpoints
  // ============================================================================

  // GET /api/transactions
  if (path === '/api/transactions' && method === 'GET') {
    const params: TransactionQueryParams = {
      profile: searchParams.profile,
      from: searchParams.from,
      to: searchParams.to,
      type: searchParams.type as any,
      limit: searchParams.limit ? parseInt(searchParams.limit, 10) : undefined,
      offset: searchParams.offset ? parseInt(searchParams.offset, 10) : undefined,
    }
    const result = await guestDataService.getTransactions(params)
    return {
      success: true,
      data: result,
    }
  }

  // POST /api/transactions
  if (path === '/api/transactions' && method === 'POST') {
    const result = await guestDataService.createTransaction(body as CreateTransactionRequest)
    return {
      success: true,
      data: result,
    }
  }

  // PUT /api/transactions/:id
  if (path.startsWith('/api/transactions/') && method === 'PUT') {
    const params = extractPathParams(path, '/api/transactions/:id')
    const result = await guestDataService.updateTransaction(
      params.id,
      body as UpdateTransactionRequest
    )
    return {
      success: true,
      data: result,
    }
  }

  // DELETE /api/transactions/:id
  if (path.startsWith('/api/transactions/') && method === 'DELETE') {
    const params = extractPathParams(path, '/api/transactions/:id')
    await guestDataService.deleteTransaction(params.id)
    return {
      success: true,
      message: 'Transaction deleted successfully',
    }
  }

  // ============================================================================
  // Statistics Endpoints
  // ============================================================================

  // GET /api/statistics
  if (path === '/api/statistics' && method === 'GET') {
    const params: StatisticsQueryParams = {
      profile: searchParams.profile || '',
      from: searchParams.from || '',
      to: searchParams.to || '',
      currency: searchParams.currency || '',
    }
    const result = await guestDataService.getStatistics(params)
    return {
      success: true,
      data: result,
    }
  }

  // ============================================================================
  // Auth Endpoints
  // ============================================================================

  // POST /api/auth/login
  if (path === '/api/auth/login' && method === 'POST') {
    // In guest mode, login always succeeds
    const user = await guestDataService.getCurrentUser()
    return {
      success: true,
      data: user,
    }
  }

  // POST /api/auth/logout
  if (path === '/api/auth/logout' && method === 'POST') {
    return {
      success: true,
      message: 'Logged out successfully',
    }
  }

  // GET /api/auth/session
  if (path === '/api/auth/session' && method === 'GET') {
    // Only return user if we're in guest mode
    // Otherwise, this should fail (backend not available or no session)
    const guestMode = await isGuestMode()
    if (guestMode) {
      const user = await guestDataService.getCurrentUser()
      return {
        success: true,
        data: user,
      }
    }
    // Not in guest mode and no backend - return error
    // This will be caught by AuthContext and user will remain null
    throw new Error('404: Endpoint not found')
  }

  // POST /api/auth/signup-request
  if (path === '/api/auth/signup-request' && method === 'POST') {
    return {
      success: true,
      message: 'Verification email sent',
    }
  }

  // GET /api/auth/verify
  if (path === '/api/auth/verify' && method === 'GET') {
    const token = searchParams.token || ''
    // Mock verification - always succeeds
    return {
      success: true,
      message: 'Email verified successfully',
      data: {
        verified: true,
      },
    }
  }

  // POST /api/auth/set-password
  if (path === '/api/auth/set-password' && method === 'POST') {
    return {
      success: true,
      message: 'Password set successfully',
    }
  }

  // POST /api/auth/forgot-password-request
  if (path === '/api/auth/forgot-password-request' && method === 'POST') {
    return {
      success: true,
      message: 'Password reset email sent',
    }
  }

  // GET /api/auth/reset-password-verify
  if (path === '/api/auth/reset-password-verify' && method === 'GET') {
    const token = searchParams.token || ''
    // Mock verification - always succeeds
    return {
      success: true,
      message: 'Token verified',
      data: {
        verified: true,
      },
    }
  }

  // POST /api/auth/reset-password
  if (path === '/api/auth/reset-password' && method === 'POST') {
    const { token, password } = body
    // Mock password reset - always succeeds
    return {
      success: true,
      message: 'Password reset successfully',
    }
  }

  // ============================================================================
  // Backup & Restore Endpoints
  // ============================================================================

  // GET /api/backup
  if (path === '/api/backup' && method === 'GET') {
    // In guest mode, generate a mock CSV
    const transactions = await guestDataService.getTransactions({})
    const csv = generateMockCSV(transactions.transactions)
    return {
      success: true,
      data: { csv },
    }
  }

  // POST /api/restore
  if (path === '/api/restore' && method === 'POST') {
    // In guest mode, restore is handled by resetting the service
    guestDataService.reset()
    return {
      success: true,
      message: 'Data restored successfully',
    }
  }

  // ============================================================================
  // Account Endpoints
  // ============================================================================

  if (path === '/api/account' && method === 'DELETE') {
    guestDataService.reset()
    return {
      success: true,
      message: 'Account deleted successfully',
    }
  }

  if (path === '/api/account/password' && method === 'PATCH') {
    return {
      success: true,
      message: 'Password updated successfully',
    }
  }

  // ============================================================================
  // Default: Return empty success response
  // ============================================================================

  return {
    success: true,
    data: {},
  }
}

/**
 * Generate mock CSV for backup
 */
function generateMockCSV(transactions: any[]): string {
  const headers = ['profile', 'occurredAt', 'amountMinor', 'currency', 'type', 'tags', 'note']
  const rows = transactions.map((t) => [
    t.profile,
    t.occurredAt,
    t.amountMinor,
    t.currency,
    t.type,
    t.tags.join(';'),
    t.note || '',
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  return csv
}

/**
 * Main API call function
 * Intercepts requests in guest mode and routes to GuestDataService
 * Otherwise makes normal fetch requests
 */
export async function apiCall<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  // Parse endpoint to check if it's an auth endpoint
  const url = new URL(endpoint, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  const path = url.pathname
  const guestMode = await isGuestMode()

  // Only intercept in Guest Mode - generate data client-side
  // When NOT in guest mode, make real API calls (will fail if backend is not available)
  if (guestMode) {
    try {
      const result = await handleGuestModeRequest(endpoint, options)
      return result as ApiResponse<T>
    } catch (error) {
      const message = getFriendlyErrorMessage(error, 'Failed to process request.')
      return {
        success: false,
        error: {
          message,
          code: isNetworkError(error) ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR',
        },
      }
    }
  }

  // Normal API call
  try {
    const response = await fetch(endpoint, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    })

    if (!response.ok) {
      // Silently handle 404s when backend is not available (expected in development)
      if (response.status === 404) {
        return {
          success: false,
          error: {
            message: 'Endpoint not found',
            code: '404',
          },
        }
      }
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: {
          message: errorData.message || response.statusText,
          code: response.status.toString(),
        },
      }
    }

    const data = await response.json()
    return data as ApiResponse<T>
  } catch (error) {
    const message = getFriendlyErrorMessage(error, 'Unable to reach the server. Please try again.')
    return {
      success: false,
      error: {
        message,
        code: isNetworkError(error) ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR',
      },
    }
  }
}

/**
 * Convenience functions for common API calls
 */

export async function getTransactions(
  params: TransactionQueryParams = {}
): Promise<ApiResponse<TransactionsListData>> {
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value)
      }
      return acc
    }, {} as Record<string, string>)
  ).toString()

  return apiCall<TransactionsListData>(`/api/transactions?${queryString}`)
}

export async function getTransaction(
  id: string
): Promise<ApiResponse<TransactionData>> {
  return apiCall<TransactionData>(`/api/transactions/${id}`)
}

export async function createTransaction(
  data: CreateTransactionRequest
): Promise<ApiResponse<TransactionData>> {
  return apiCall<TransactionData>('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTransaction(
  id: string,
  data: UpdateTransactionRequest
): Promise<ApiResponse<TransactionData>> {
  return apiCall<TransactionData>(`/api/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteTransaction(
  id: string
): Promise<ApiResponse<{ message: string }>> {
  return apiCall<{ message: string }>(`/api/transactions/${id}`, {
    method: 'DELETE',
  })
}

export async function getStatistics(
  params: StatisticsQueryParams
): Promise<ApiResponse<StatisticsData>> {
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value)
      }
      return acc
    }, {} as Record<string, string>)
  ).toString()

  return apiCall<StatisticsData>(`/api/statistics?${queryString}`)
}

export async function getCurrentUser(): Promise<ApiResponse<UserData>> {
  return apiCall<UserData>('/api/auth/session')
}

export async function login(
  email: string,
  password: string
): Promise<ApiResponse<UserData>> {
  return apiCall<UserData>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function logout(): Promise<ApiResponse<{ message: string }>> {
  return apiCall<{ message: string }>('/api/auth/logout', {
    method: 'POST',
  })
}

export async function deleteAccount(): Promise<
  ApiResponse<{ message: string }>
> {
  return apiCall<{ message: string }>('/api/account', {
    method: 'DELETE',
  })
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<{ message: string }>> {
  return apiCall<{ message: string }>('/api/account/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export async function signupRequest(
  email: string
): Promise<ApiResponse<{ message: string }>> {
  return apiCall<{ message: string }>('/api/auth/signup-request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function verifyEmail(
  token: string
): Promise<ApiResponse<{ verified: boolean; message: string }>> {
  const queryString = new URLSearchParams({ token }).toString()
  return apiCall<{ verified: boolean; message: string }>(`/api/auth/verify?${queryString}`, {
    method: 'GET',
  })
}

export async function setPassword(
  token: string,
  password: string
): Promise<ApiResponse<{ message: string }>> {
  return apiCall<{ message: string }>('/api/auth/set-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

export async function forgotPasswordRequest(
  email: string
): Promise<ApiResponse<{ message: string }>> {
  return apiCall<{ message: string }>('/api/auth/forgot-password-request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function verifyResetPasswordToken(
  token: string
): Promise<ApiResponse<{ verified: boolean; message: string }>> {
  const queryString = new URLSearchParams({ token }).toString()
  return apiCall<{ verified: boolean; message: string }>(
    `/api/auth/reset-password-verify?${queryString}`,
    {
      method: 'GET',
    }
  )
}

export async function resetPassword(
  token: string,
  password: string
): Promise<ApiResponse<{ message: string }>> {
  return apiCall<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

// ============================================================================
// Setup API Calls
// ============================================================================

export async function getSetupCatalog(): Promise<
  ApiResponse<{ catalog: SetupCatalogData }>
> {
  return apiCall<{ catalog: SetupCatalogData }>('/api/setup/catalog')
}

