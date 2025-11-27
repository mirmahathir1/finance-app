import { prisma } from '@/lib/prisma'
import {
  generateToken,
  isValidEmail,
  verifyPassword,
  sanitizeUser,
  setSessionCookie,
} from '@/app/api/auth/_lib/helpers'
import { errorResponse, success } from '@/app/api/auth/_lib/responses'

interface LoginBody {
  email?: string
  password?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody
    const email = body.email?.toLowerCase().trim()
    const { password } = body

    if (!isValidEmail(email) || !password) {
      return errorResponse('Invalid email or password.', 400)
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return errorResponse('Invalid email or password.', 401)
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      return errorResponse('Invalid email or password.', 401)
    }

    if (!user.emailVerifiedAt) {
      return errorResponse('Please verify your email before signing in.', 403)
    }

    const sessionToken = generateToken(32)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { sessionToken },
    })

    await setSessionCookie(sessionToken)

    return success({
      user: sanitizeUser(updatedUser),
    })
  } catch (error: any) {
    // Handle database schema not initialized (tables don't exist)
    const errorMessage = error?.message || ''
    if (
      errorMessage.includes('relation') &&
      errorMessage.includes('does not exist')
    ) {
      return errorResponse(
        'Database not initialized. Please run migrations.',
        500
      )
    }

    return errorResponse('Unable to sign in. Please try again later.', 500)
  }
}

