import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthenticatedUser } from '@/app/api/_lib/auth'
import { success, errorResponse } from '@/app/api/auth/_lib/responses'
import type { TransactionType } from '@prisma/client'

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuthenticatedUser()
  if (!user) {
    return response!
  }

  try {
    const body = (await request.json()) as {
      profile: string
      oldTagName: string
      newTagName?: string
      newTransactionType?: TransactionType
    }

    const profile = typeof body.profile === 'string' ? body.profile.trim() : ''
    const oldTagName = typeof body.oldTagName === 'string' ? body.oldTagName.trim() : ''
    const newTagName = typeof body.newTagName === 'string' ? body.newTagName.trim() : undefined
    const newTransactionType = body.newTransactionType

    if (!profile) {
      return errorResponse('Profile is required.', 400)
    }

    if (!oldTagName) {
      return errorResponse('Old tag name is required.', 400)
    }

    if (!newTagName && !newTransactionType) {
      return errorResponse('Either new tag name or new transaction type must be provided.', 400)
    }

    // Use raw SQL to update all transactions in a single query
    // This is more efficient than looping through transactions
    let result

    if (newTagName && newTagName !== oldTagName && newTransactionType) {
      // Both tag rename and type change
      result = await prisma.$executeRaw`
        UPDATE transactions
        SET 
          tags = array_replace(tags, ${oldTagName}, ${newTagName}),
          type = ${newTransactionType}::"TransactionType",
          "updatedAt" = NOW()
        WHERE 
          "userId" = ${user.id}
          AND profile = ${profile}
          AND ${oldTagName} = ANY(tags)
      `
    } else if (newTagName && newTagName !== oldTagName) {
      // Only tag rename
      result = await prisma.$executeRaw`
        UPDATE transactions
        SET 
          tags = array_replace(tags, ${oldTagName}, ${newTagName}),
          "updatedAt" = NOW()
        WHERE 
          "userId" = ${user.id}
          AND profile = ${profile}
          AND ${oldTagName} = ANY(tags)
      `
    } else if (newTransactionType) {
      // Only type change
      result = await prisma.$executeRaw`
        UPDATE transactions
        SET 
          type = ${newTransactionType}::"TransactionType",
          "updatedAt" = NOW()
        WHERE 
          "userId" = ${user.id}
          AND profile = ${profile}
          AND ${oldTagName} = ANY(tags)
          AND type != ${newTransactionType}::"TransactionType"
      `
    } else {
      return success({
        updatedCount: 0,
      })
    }

    return success({
      updatedCount: Number(result),
    })
  } catch (error) {
    console.error('update transactions for tag error', error)
    return errorResponse('Unable to update transactions.', 500)
  }
}

