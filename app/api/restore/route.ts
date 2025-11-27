import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthenticatedUser } from '@/app/api/_lib/auth'
import { success, errorResponse } from '@/app/api/auth/_lib/responses'
import type { TransactionType } from '@prisma/client'

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
] as const

const RESTORE_CONFIRM_TOKEN = 'finance-app'

interface ParsedRow {
  profile: string
  occurredAt: Date
  amountMinor: number
  currency: string
  type: TransactionType
  tags: string[]
  note: string | null
  createdAt: Date
  updatedAt: Date
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase()
}

function normalizeString(value: string | undefined) {
  return value?.trim() ?? ''
}

function parseTags(value: string) {
  if (!value) return []
  return value
    .split(';')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

async function extractCsvBody(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const file = formData.get('file')
    if (file && typeof file === 'object' && 'text' in file) {
      return file.text()
    }
    return null
  }

  return request.text()
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuthenticatedUser()
  if (!user) {
    return response!
  }

  try {
    const confirmHeader = request.headers.get('x-restore-confirm')
    if (confirmHeader !== RESTORE_CONFIRM_TOKEN) {
      return errorResponse('Restore confirmation header missing or invalid.', 400)
    }

    const csvBody = await extractCsvBody(request)
    if (!csvBody || !csvBody.trim()) {
      return errorResponse('CSV body is required.', 400)
    }

    const normalized = csvBody.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = normalized.split('\n').filter((line, index) => line.length > 0 || index === 0)
    if (lines.length === 0) {
      return errorResponse('CSV body is empty.', 400)
    }

    const headerLine = lines[0]
    const headersInFile = splitCsvLine(headerLine).map(normalizeHeader)
    const expectedHeaders = CSV_HEADERS

    if (
      headersInFile.length !== expectedHeaders.length ||
      headersInFile.some((header, index) => header !== expectedHeaders[index])
    ) {
      return errorResponse(
        `CSV headers must match: ${CSV_HEADERS.join(', ')}`,
        400
      )
    }

    const errors: string[] = []
    const rows: ParsedRow[] = []

    lines.slice(1).forEach((line, idx) => {
      const rowNumber = idx + 2
      if (!line.trim()) {
        return
      }

      const columns = splitCsvLine(line)
      if (columns.length !== CSV_HEADERS.length) {
        errors.push(`Row ${rowNumber}: expected ${CSV_HEADERS.length} columns.`)
        return
      }

      const rowErrors: string[] = []

      const [
        profileValue,
        occurredAtValue,
        amountValue,
        currencyValue,
        typeValue,
        tagsValue,
        noteValue,
        createdAtValue,
        updatedAtValue,
      ] = columns.map((value) => value.trim())

      const profile = normalizeString(profileValue)
      if (!profile) {
        rowErrors.push(`Row ${rowNumber}: profile is required.`)
      }

      const occurredAt = new Date(occurredAtValue)
      if (Number.isNaN(occurredAt.getTime())) {
        rowErrors.push(`Row ${rowNumber}: occurred_at must be a valid ISO date.`)
      }

      const amountMinor = Number.parseInt(amountValue, 10)
      if (!Number.isFinite(amountMinor)) {
        rowErrors.push(`Row ${rowNumber}: amount_minor must be an integer.`)
      }

      const currency = currencyValue?.toUpperCase()
      if (!currency || currency.length !== 3) {
        rowErrors.push(`Row ${rowNumber}: currency must be a 3-letter code.`)
      }

      const type =
        typeValue === 'income' || typeValue === 'expense' ? typeValue : null
      if (!type) {
        rowErrors.push(`Row ${rowNumber}: type must be "income" or "expense".`)
      }

      const tags = parseTags(tagsValue)
      if (tags.length === 0) {
        rowErrors.push(`Row ${rowNumber}: at least one tag is required.`)
      }

      const note = noteValue ? noteValue : null

      const createdAt = new Date(createdAtValue || occurredAtValue)
      const updatedAt = new Date(updatedAtValue || occurredAtValue)
      if (Number.isNaN(createdAt.getTime())) {
        rowErrors.push(`Row ${rowNumber}: created_at must be a valid ISO date.`)
      }
      if (Number.isNaN(updatedAt.getTime())) {
        rowErrors.push(`Row ${rowNumber}: updated_at must be a valid ISO date.`)
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors)
        return
      }

      rows.push({
        profile,
        occurredAt,
        amountMinor,
        currency,
        type: type as TransactionType,
        tags,
        note,
        createdAt,
        updatedAt,
      })
    })

    if (errors.length > 0) {
      return errorResponse('Restore failed due to CSV validation errors.', 400, {
        rows: errors,
      })
    }

    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.transaction.deleteMany({
        where: { userId: user.id },
      })

      if (rows.length === 0) {
        return { deletedCount: deleted.count, createdCount: 0 }
      }

      const payload = rows.map((row) => ({
        userId: user.id,
        profile: row.profile,
        occurredAt: row.occurredAt,
        amountMinor: BigInt(row.amountMinor),
        currency: row.currency,
        type: row.type,
        tags: row.tags,
        note: row.note,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }))

      const created = await tx.transaction.createMany({
        data: payload,
      })

      return { deletedCount: deleted.count, createdCount: created.count }
    })

    return success({
      restored: {
        transactionCount: result.createdCount,
        deletedCount: result.deletedCount,
      },
      message: 'Backup restored successfully.',
    })
  } catch {
    return errorResponse('Unable to restore backup.', 500)
  }
}


