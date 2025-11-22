import { prisma } from '@/lib/prisma'
import {
  generateToken,
  isValidEmail,
  RESET_TOKEN_TTL_MS,
} from '@/app/api/auth/_lib/helpers'
import { sendPasswordResetEmail } from '@/app/api/auth/_lib/email'
import { errorResponse, successMessage } from '@/app/api/auth/_lib/responses'
import { checkRateLimit } from '@/app/api/auth/_lib/rateLimiter'

interface ForgotPasswordBody {
  email?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ForgotPasswordBody
    const email = body.email?.toLowerCase().trim()

    if (!email || !isValidEmail(email)) {
      return errorResponse('Please provide a valid email address.', 400)
    }

    // Check rate limit (3 requests per minute)
    const rateLimit = checkRateLimit(email, 3, 60 * 1000)
    if (!rateLimit.allowed) {
      const retryAfter = rateLimit.retryAfter || 60
      return errorResponse(
        `Too many password reset requests. Please try again in ${retryAfter} second${retryAfter !== 1 ? 's' : ''}.`,
        429
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (user) {
      const resetToken = generateToken()
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordTokenExpiresAt: expiresAt,
        },
      })
      await sendPasswordResetEmail(email, resetToken)
    }

    return successMessage('Password reset email sent')
  } catch (error) {
    console.error('forgot-password-request error', error)
    return errorResponse('Unable to start password reset. Please try again later.', 500)
  }
}

