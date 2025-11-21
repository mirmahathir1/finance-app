import { prisma } from '@/lib/prisma'
import {
  errorResponse,
  successMessage,
} from '@/app/api/auth/_lib/responses'
import {
  generateToken,
  getSessionToken,
  hashPassword,
  isValidPassword,
  setSessionCookie,
  verifyPassword,
} from '@/app/api/auth/_lib/helpers'

interface ChangePasswordBody {
  currentPassword?: string
  newPassword?: string
}

export async function PATCH(request: Request) {
  try {
    const sessionToken = getSessionToken()

    if (!sessionToken) {
      return errorResponse('Not authenticated.', 401)
    }

    const body = (await request.json()) as ChangePasswordBody
    const currentPassword = body.currentPassword?.trim()
    const newPassword = body.newPassword?.trim()

    if (!currentPassword || !newPassword) {
      return errorResponse('Current and new passwords are required.', 400)
    }

    if (!isValidPassword(newPassword)) {
      return errorResponse(
        'New password must be at least 8 characters long.',
        400
      )
    }

    if (currentPassword === newPassword) {
      return errorResponse('New password must be different.', 400)
    }

    const user = await prisma.user.findFirst({
      where: { sessionToken },
    })

    if (!user) {
      return errorResponse('Session expired. Please sign in again.', 401)
    }

    const isCurrentValid = await verifyPassword(
      currentPassword,
      user.passwordHash
    )

    if (!isCurrentValid) {
      return errorResponse('Current password is incorrect.', 400)
    }

    const passwordHash = await hashPassword(newPassword)
    const newSessionToken = generateToken(32)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        sessionToken: newSessionToken,
      },
    })

    setSessionCookie(newSessionToken)

    return successMessage('Password updated successfully.')
  } catch (error: any) {
    const message = error?.message || ''
    if (
      message.includes('relation') &&
      message.includes('does not exist')
    ) {
      console.error('change password error: database schema missing', error)
      return errorResponse(
        'Database not initialized. Please run migrations.',
        500
      )
    }

    console.error('change password error', error)
    return errorResponse(
      'Unable to update password. Please try again later.',
      500
    )
  }
}

