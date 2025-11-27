'use client'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CURRENCY_REGEX = /^[A-Z]{3}$/

export function validateEmail(value: string): string | null {
  if (!value.trim()) {
    return 'Email is required'
  }
  if (!EMAIL_REGEX.test(value.trim())) {
    return 'Please enter a valid email address'
  }
  return null
}

export function validatePassword(value: string, { minLength = 6 } = {}): string | null {
  if (!value) {
    return 'Password is required'
  }
  if (value.length < minLength) {
    return `Password must be at least ${minLength} characters`
  }
  return null
}

export function validateRequired(value: string, message = 'This field is required'): string | null {
  return value.trim() ? null : message
}

export function validateCurrencyCode(value: string): string | null {
  if (!value.trim()) {
    return 'Currency is required'
  }
  if (!CURRENCY_REGEX.test(value.trim().toUpperCase())) {
    return 'Currency code must be 3 uppercase letters'
  }
  return null
}

export function validateAmount(amountMinor: number): string | null {
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    return 'Amount must be greater than 0'
  }
  return null
}

