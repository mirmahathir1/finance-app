import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthenticatedUser } from '@/app/api/_lib/auth'
import { success, errorResponse } from '@/app/api/auth/_lib/responses'

export async function PUT(request: NextRequest) {
  const { user, response } = await requireAuthenticatedUser()
  if (!user) {
    return response!
  }

  try {
    const body = (await request.json()) as { percentage: unknown }
    const percentage = body.percentage

    if (
      typeof percentage !== 'number' ||
      !Number.isInteger(percentage) ||
      percentage < 0 ||
      percentage > 100
    ) {
      return errorResponse(
        'Budget percentage must be an integer between 0 and 100.',
        400
      )
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { budgetPercentage: percentage },
      select: { budgetPercentage: true },
    })

    return success({
      budgetPercentage: updated.budgetPercentage,
    })
  } catch {
    return errorResponse('Unable to save budget percentage.', 500)
  }
}
