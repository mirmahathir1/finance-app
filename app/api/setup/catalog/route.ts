import { prisma } from '@/lib/prisma'
import { requireAuthenticatedUser } from '@/app/api/_lib/auth'
import { success, errorResponse } from '@/app/api/auth/_lib/responses'
import { summarizeCatalog } from '@/lib/catalog-summary'
import type { CatalogSummaryInput } from '@/lib/catalog-summary'

export async function GET() {
  const { user, response } = await requireAuthenticatedUser()
  if (!user) {
    return response!
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      select: {
        profile: true,
        currency: true,
        type: true,
        tags: true,
      },
      orderBy: {
        occurredAt: 'desc',
      },
    })

    const inputs: CatalogSummaryInput[] = transactions.map((transaction) => ({
      profile: transaction.profile,
      currency: transaction.currency,
      type: transaction.type,
      tags: transaction.tags ?? [],
    }))

    return success({
      catalog: summarizeCatalog(inputs),
    })
  } catch {
    return errorResponse(
      'Unable to analyze transactions for setup. Please try again later.',
      500
    )
  }
}

