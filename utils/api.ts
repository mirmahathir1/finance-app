'use client'

import type {
  ApiErrorResponse,
  ApiResponse,
  TransactionsListData,
  TransactionData,
  StatisticsData,
  StatisticsCalendarData,
  UserData,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionQueryParams,
  StatisticsQueryParams,
  StatisticsCalendarQueryParams,
  TransactionType,
  SetupCatalogData,
} from '@/types'
import { getFriendlyErrorMessage, isNetworkError } from '@/utils/error'

const REQUEST_LOG_STYLE = 'color: #9c27b0; font-weight: bold;'
const RESPONSE_LOG_STYLE = 'color: #2e7d32; font-weight: bold;'

type RequestLogInfo = {
  method: string
  url: string
}

function formatLogMessage(prefix: 'Request' | 'Response', info: RequestLogInfo) {
  const direction = prefix === 'Request' ? 'to' : 'from'
  return `[API] ${prefix} ${direction} ${info.method} ${info.url}`
}

function normalizePayload(payload: unknown) {
  if (payload === undefined || payload === null || payload === '') {
    return undefined
  }

  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload)
    } catch {
      return payload
    }
  }

  return payload
}

function logClientRequest(info: RequestLogInfo, payload: unknown) {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') return
  const normalized = normalizePayload(payload)
  console.log(`%c${formatLogMessage('Request', info)}`, REQUEST_LOG_STYLE, normalized)
}

function logClientResponse(info: RequestLogInfo, payload: unknown) {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') return
  const normalized = normalizePayload(payload)
  console.log(`%c${formatLogMessage('Response', info)}`, RESPONSE_LOG_STYLE, normalized)
}

function getRequestInfo(endpoint: string, options?: RequestInit): RequestLogInfo {
  const method = options?.method || 'GET'
  const url = new URL(
    endpoint,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  ).toString()
  return { method, url }
}

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

export type BlobApiResponse = {
  success: boolean
  data?: Blob
  error?: {
    message: string
    code?: string
  }
}

type ExchangeRateSnapshot = {
  result?: string
  rates?: Record<string, number>
  error?: string
}

export async function downloadBackupCsv(): Promise<BlobApiResponse> {
  const endpoint = '/api/backup'
  const requestOptions: RequestInit = { method: 'GET' }
  const info = getRequestInfo(endpoint, requestOptions)
  logClientRequest(info, undefined)

  try {
    const response = await fetch(endpoint, {
      ...requestOptions,
      credentials: 'include',
      headers: {
        Accept: 'text/csv, text/plain;q=0.9, */*;q=0.8',
      },
    })

    if (!response.ok) {
      const errorPayload = await response.clone().json().catch(async () => {
        const fallbackText = await response.text().catch(() => '')
        return fallbackText ? { message: fallbackText } : null
      })

      logClientResponse(info, errorPayload ?? { status: response.status })

      return {
        success: false,
        error: {
          message:
            errorPayload?.error?.message ||
            errorPayload?.message ||
            response.statusText ||
            'Failed to generate backup.',
          code: response.status.toString(),
        },
      }
    }

    const blob = await response.blob()
    logClientResponse(info, { success: true, message: 'CSV blob generated' })

    return {
      success: true,
      data: blob,
    }
  } catch (error) {
    const message = getFriendlyErrorMessage(error, 'Unable to reach the server. Please try again.')
    logClientResponse(info, {
      success: false,
      error: { message },
    })
    return {
      success: false,
      error: {
        message,
        code: isNetworkError(error) ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR',
      },
    }
  }
}

type ExchangeRateSnapshotResponse = {
  success: boolean
  data?: ExchangeRateSnapshot
  error?: {
    message: string
    code?: string
  }
}

export async function fetchExchangeRateSnapshot(
  currencyCode: string
): Promise<ExchangeRateSnapshotResponse> {
  const normalizedCode = currencyCode.trim().toUpperCase()
  const endpoint = `https://open.er-api.com/v6/latest/${normalizedCode}`
  const requestOptions: RequestInit = { method: 'GET' }
  const info = getRequestInfo(endpoint, requestOptions)
  logClientRequest(info, undefined)

  try {
    const response = await fetch(endpoint, requestOptions)
    const payload: ExchangeRateSnapshot | null = await response.json().catch(() => null)

    logClientResponse(info, payload ?? { status: response.status })

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: payload?.error || response.statusText || 'Failed to validate currency.',
          code: response.status.toString(),
        },
      }
    }

    return {
      success: true,
      data: payload ?? undefined,
    }
  } catch (error) {
    const message = getFriendlyErrorMessage(error, 'Unable to reach exchange rate service.')
    logClientResponse(info, {
      success: false,
      error: { message },
    })
    return {
      success: false,
      error: {
        message,
        code: isNetworkError(error) ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR',
      },
    }
  }
}

export async function apiCall<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const info = getRequestInfo(endpoint, options)
  const requestPayload = parseBody(options?.body)
  logClientRequest(info, requestPayload)

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
      if (response.status === 404) {
        const notFoundPayload: ApiErrorResponse = {
          success: false,
          error: {
            message: 'Endpoint not found',
            code: '404',
          },
        }
        logClientResponse(info, notFoundPayload)
        return notFoundPayload
      }
      const errorData = await response.json().catch(() => ({}))
      const errorPayload: ApiErrorResponse = {
        success: false,
        error: {
          message: errorData.message || response.statusText,
          code: response.status.toString(),
        },
      }
      logClientResponse(info, errorPayload)
      return errorPayload
    }

    const data = await response.json()
    logClientResponse(info, data)
    return data as ApiResponse<T>
  } catch (error) {
    logClientResponse(info, {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    })
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

export async function getStatisticsCalendar(
  params: StatisticsCalendarQueryParams
): Promise<ApiResponse<StatisticsCalendarData>> {
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value)
      }
      return acc
    }, {} as Record<string, string>)
  ).toString()

  return apiCall<StatisticsCalendarData>(`/api/statistics/calendar?${queryString}`)
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

export async function getSetupCatalog(): Promise<
  ApiResponse<{ catalog: SetupCatalogData }>
> {
  return apiCall<{ catalog: SetupCatalogData }>('/api/setup/catalog')
}

export async function bulkUpdateTransactionsProfile(
  oldName: string,
  newName: string
): Promise<ApiResponse<{ updatedCount: number }>> {
  return apiCall<{ updatedCount: number }>('/api/profiles/rename', {
    method: 'POST',
    body: JSON.stringify({ oldName, newName }),
  })
}

export async function bulkUpdateTransactionsTag(
  profile: string,
  oldTagName: string,
  options?: {
    newTagName?: string
    newTransactionType?: TransactionType
  }
): Promise<ApiResponse<{ updatedCount: number }>> {
  return apiCall<{ updatedCount: number }>('/api/tags/update-transactions', {
    method: 'POST',
    body: JSON.stringify({
      profile,
      oldTagName,
      newTagName: options?.newTagName,
      newTransactionType: options?.newTransactionType,
    }),
  })
}
