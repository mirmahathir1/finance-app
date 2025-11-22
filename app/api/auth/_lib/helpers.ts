import { cookies } from 'next/headers'
import type { User } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export const SESSION_COOKIE_NAME = 'session_token'
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
export const VERIFICATION_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour
export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000 // 30 minutes

export function generateToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString('hex')
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(
  password: string,
  hash?: string | null
): Promise<boolean> {
  if (!hash) return false
  return bcrypt.compare(password, hash)
}

export function sanitizeUser(user: User) {
  const {
    passwordHash,
    passwordSalt,
    verificationToken,
    verificationTokenExpiresAt,
    resetPasswordToken,
    resetPasswordTokenExpiresAt,
    sessionToken,
    ...safe
  } = user
  return safe
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    maxAge: SESSION_COOKIE_MAX_AGE,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV !== 'development',
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    maxAge: 0,
    path: '/',
  })
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value
}

export function isValidEmail(email?: string | null): boolean {
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPassword(password?: string | null): boolean {
  if (!password) return false
  return password.length >= 8
}

