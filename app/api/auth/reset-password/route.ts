import { prisma } from '@/lib/prisma'
import {
  hashPassword,
  isValidPassword,
} from '@/app/api/auth/_lib/helpers'
import { errorResponse, successMessage } from '@/app/api/auth/_lib/responses'

interface ResetPasswordBody {
  token?: string
  password?: string
}

export async function POST(request: Request) {
  try {
    const { token, password } = (await request.json()) as ResetPasswordBody

    if (!token) {
      return errorResponse('Missing reset token.', 400)
    }

    if (!isValidPassword(password)) {
      return errorResponse('Password must be at least 8 characters long.', 400)
    }

    if (!password) {
      return errorResponse('Password is required.', 400)
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExpiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    })

    if (!user) {
      return errorResponse('Reset token is invalid or expired.', 400)
    }

    const passwordHash = await hashPassword(password)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordTokenExpiresAt: null,
        emailVerifiedAt: new Date(),
      },
    })

    return successMessage('Password reset successfully.')
  } catch (error) {
    console.error('reset-password error', error)
    return errorResponse('Unable to reset password. Please try again later.', 500)
  }
}

