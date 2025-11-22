import type { User } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  clearSessionCookie,
  getSessionToken,
} from '@/app/api/auth/_lib/helpers'
import { errorResponse } from '@/app/api/auth/_lib/responses'

interface AuthResult {
  user: User | null
  response?: Response
}

/**
 * Helper that resolves the authenticated user from the session cookie.
 * Returns { user } when authenticated or { user: null, response } when not.
 */
export async function requireAuthenticatedUser(): Promise<AuthResult> {
  const token = await getSessionToken()

  if (!token) {
    return {
      user: null,
      response: errorResponse('Not authenticated.', 401),
    }
  }

  const user = await prisma.user.findFirst({
    where: { sessionToken: token },
  })

  if (!user) {
    await clearSessionCookie()
    return {
      user: null,
      response: errorResponse('Session expired.', 401),
    }
  }

  return { user }
}


