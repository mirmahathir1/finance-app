import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  generateToken,
  isValidEmail,
  VERIFICATION_TOKEN_TTL_MS,
} from '@/app/api/auth/_lib/helpers'
import { sendVerificationEmail } from '@/app/api/auth/_lib/email'
import { errorResponse, successMessage } from '@/app/api/auth/_lib/responses'
import { checkRateLimit } from '@/app/api/auth/_lib/rateLimiter'

interface SignupRequestBody {
  email?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignupRequestBody
    const email = body.email?.toLowerCase().trim()

    if (!isValidEmail(email)) {
      return errorResponse('Please provide a valid email address.', 400)
    }

    if (!email) {
      return errorResponse('Email is required.', 400)
    }

    // Check rate limit (3 requests per minute)
    const rateLimit = checkRateLimit(email, 3, 60 * 1000)
    if (!rateLimit.allowed) {
      const retryAfter = rateLimit.retryAfter || 60
      return errorResponse(
        `Too many signup requests. Please try again in ${retryAfter} second${retryAfter !== 1 ? 's' : ''}.`,
        429
      )
    }

    const verificationToken = generateToken()
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS)

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          verificationToken,
          verificationTokenExpiresAt: expiresAt,
        },
      })
    } else {
      await prisma.user.create({
        data: {
          email,
          passwordHash: '',
          verificationToken,
          verificationTokenExpiresAt: expiresAt,
        },
      })
    }

    await sendVerificationEmail(email, verificationToken)

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
      data: {
        token: verificationToken,
        expiresAt,
      },
    })
  } catch (error) {
    console.error('signup-request error', error)
    return errorResponse('Unable to start signup flow. Please try again later.', 500)
  }
}

