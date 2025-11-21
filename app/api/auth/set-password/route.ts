import { prisma } from '@/lib/prisma'
import {
  generateToken,
  hashPassword,
  isValidPassword,
  sanitizeUser,
  setSessionCookie,
} from '@/app/api/auth/_lib/helpers'
import { errorResponse, success } from '@/app/api/auth/_lib/responses'

interface SetPasswordBody {
  token?: string
  password?: string
}

export async function POST(request: Request) {
  try {
    const { token, password } = (await request.json()) as SetPasswordBody

    if (!token) {
      return errorResponse('Missing verification token.', 400)
    }

    if (!isValidPassword(password)) {
      return errorResponse('Password must be at least 8 characters long.', 400)
    }

    if (!password) {
      return errorResponse('Password is required.', 400)
    }

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiresAt: { gt: new Date() },
      },
      select: {
        id: true,
      },
    })

    if (!user) {
      return errorResponse('Verification token is invalid or expired.', 400)
    }

    const passwordHash = await hashPassword(password)

    const sessionToken = generateToken(32)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        verificationToken: null,
        verificationTokenExpiresAt: null,
        emailVerifiedAt: new Date(),
        sessionToken,
      },
    })

    setSessionCookie(sessionToken)

    return success({
      user: sanitizeUser(updatedUser),
      message: 'Password set successfully.',
    })
  } catch (error) {
    console.error('set-password error', error)
    return errorResponse('Unable to set password. Please try again later.', 500)
  }
}

