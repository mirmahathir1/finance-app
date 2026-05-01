import { prisma } from '@/lib/prisma'
import {
  clearSessionCookie,
  getSessionToken,
  sanitizeUser,
  setSessionCookie,
} from '@/app/api/auth/_lib/helpers'
import { errorResponse, success } from '@/app/api/auth/_lib/responses'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const token = await getSessionToken()

    if (!token) {
      return errorResponse('Not authenticated.', 401)
    }

    const user = await prisma.user.findFirst({
      where: { sessionToken: token },
    })

    if (!user) {
      await clearSessionCookie()
      return errorResponse('Session is no longer valid.', 401)
    }

    // Re-assert the persistent cookie on session checks.
    await setSessionCookie(token)

    return success({
      user: sanitizeUser(user),
    })
  } catch (error: any) {
    // Handle database schema not initialized (tables don't exist)
    const errorMessage = error?.message || ''
    if (
      errorMessage.includes('relation') &&
      errorMessage.includes('does not exist')
    ) {
      // Database tables don't exist yet - treat as not authenticated
      return errorResponse('Not authenticated.', 401)
    }

    return errorResponse('Unable to fetch session.', 500)
  }
}
