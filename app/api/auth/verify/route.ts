import { prisma } from '@/lib/prisma'
import { errorResponse, success } from '@/app/api/auth/_lib/responses'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return errorResponse('Missing verification token.', 400)
    }

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiresAt: {
          gt: new Date(),
        },
      },
      select: {
        email: true,
        verificationTokenExpiresAt: true,
      },
    })

    if (!user) {
      return errorResponse('Verification token is invalid or expired.', 400)
    }

    return success({
      verified: true,
      email: user.email,
      expiresAt: user.verificationTokenExpiresAt,
    })
  } catch {
    return errorResponse('Unable to verify email token. Please try again later.', 500)
  }
}

