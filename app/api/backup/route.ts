import { prisma } from '@/lib/prisma'
import { requireAuthenticatedUser } from '@/app/api/_lib/auth'
import { errorResponse } from '@/app/api/auth/_lib/responses'

const CSV_HEADERS = [
  'profile',
  'occurred_at',
  'amount_minor',
  'currency',
  'type',
  'tags',
  'note',
  'created_at',
  'updated_at',
]

function escapeCsvValue(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return ''
  }

  const needsQuotes = /[",\r\n]/.test(value)
  if (!needsQuotes) {
    return value
  }

  return `"${value.replace(/"/g, '""')}"`
}

export async function GET() {
  const { user, response } = await requireAuthenticatedUser()
  if (!user) {
    return response!
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: [
        { occurredAt: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    const rows = transactions.map((transaction) => {
      const tags = transaction.tags?.join(';') ?? ''
      const note = transaction.note ?? ''

      const columns = [
        transaction.profile,
        transaction.occurredAt.toISOString(),
        transaction.amountMinor.toString(),
        transaction.currency,
        transaction.type,
        tags,
        note,
        transaction.createdAt.toISOString(),
        transaction.updatedAt.toISOString(),
      ]

      return columns.map(escapeCsvValue).join(',')
    })

    const csv = [CSV_HEADERS.join(','), ...rows].join('\n')
    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return errorResponse('Unable to generate backup.', 500)
  }
}


