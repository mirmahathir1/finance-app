import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthenticatedUser } from '@/app/api/_lib/auth'
import { success, errorResponse } from '@/app/api/auth/_lib/responses'

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuthenticatedUser()
  if (!user) {
    return response!
  }

  try {
    const body = (await request.json()) as { oldName: string; newName: string }
    const oldName = typeof body.oldName === 'string' ? body.oldName.trim() : ''
    const newName = typeof body.newName === 'string' ? body.newName.trim() : ''

    if (!oldName) {
      return errorResponse('Old profile name is required.', 400)
    }

    if (!newName) {
      return errorResponse('New profile name is required.', 400)
    }

    if (oldName === newName) {
      return errorResponse('New name must be different from old name.', 400)
    }

    // Update all transactions with the old profile name to the new profile name in a single query
    const result = await prisma.transaction.updateMany({
      where: {
        userId: user.id,
        profile: oldName,
      },
      data: {
        profile: newName,
      },
    })

    return success({
      updatedCount: result.count,
    })
  } catch (error) {
    console.error('rename profile error', error)
    return errorResponse('Unable to rename profile.', 500)
  }
}

