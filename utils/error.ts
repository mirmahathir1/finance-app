'use client'

/**
 * Utilities for normalizing and presenting user-friendly error messages.
 */

const NETWORK_ERROR_PATTERNS = [
  'typeerror: failed to fetch',
  'failed to fetch',
  'network request failed',
  'networkerror',
  'network error',
  'load failed',
  'network_timeout',
] as const

/**
 * Normalize unknown errors to a string message.
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!error) {
    return fallback
  }

  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    return error.message || fallback
  }

  if (typeof error === 'object' && 'message' in (error as any)) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
  }

  return fallback
}

/**
 * Detect whether the error is likely caused by a network failure.
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error, '').toLowerCase()
  if (!message) {
    return false
  }
  return NETWORK_ERROR_PATTERNS.some((pattern) => message.includes(pattern))
}

/**
 * Convert an unknown error into a friendly, user-facing message.
 */
export function getFriendlyErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (isNetworkError(error)) {
    return 'Unable to connect. Please check your internet connection and try again.'
  }

  return getErrorMessage(error, fallback)
}

/**
 * Helper to safely log unexpected errors (without interrupting the UI).
 */
export function logError(_context: string, _error: unknown) {}

