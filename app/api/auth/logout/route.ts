import { prisma } from '@/lib/prisma'
import {
  clearSessionCookie,
  getSessionToken,
} from '@/app/api/auth/_lib/helpers'
import { successMessage } from '@/app/api/auth/_lib/responses'

export async function POST() {
  try {
    const token = await getSessionToken()
    if (token) {
      await prisma.user.updateMany({
        where: { sessionToken: token },
        data: { sessionToken: null },
      })
    }

    await clearSessionCookie()

    return successMessage('Logged out successfully.')
  } catch {
    await clearSessionCookie()
    return successMessage('Logged out successfully.')
  }
}

