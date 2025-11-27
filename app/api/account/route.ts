import { prisma } from '@/lib/prisma'
import {
  clearSessionCookie,
  getSessionToken,
} from '@/app/api/auth/_lib/helpers'
import {
  errorResponse,
  successMessage,
} from '@/app/api/auth/_lib/responses'

export async function DELETE() {
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
      return errorResponse('Session expired.', 401)
    }

    await prisma.user.delete({
      where: { id: user.id },
    })

    await clearSessionCookie()

    return successMessage('Account deleted successfully.')
  } catch {
    return errorResponse(
      'Unable to delete account. Please try again later.',
      500
    )
  }
}


