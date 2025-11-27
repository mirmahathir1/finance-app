import { prisma } from '@/lib/prisma'
import { errorResponse, success } from '@/app/api/auth/_lib/responses'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return errorResponse('Missing reset token.', 400)
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExpiresAt: {
          gt: new Date(),
        },
      },
      select: {
        email: true,
        resetPasswordTokenExpiresAt: true,
      },
    })

    if (!user) {
      return errorResponse('Reset token is invalid or expired.', 400)
    }

    return success({
      verified: true,
      email: user.email,
      expiresAt: user.resetPasswordTokenExpiresAt,
    })
  } catch {
    return errorResponse('Unable to verify reset token.', 500)
  }
}

