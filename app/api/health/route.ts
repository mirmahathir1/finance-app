import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCatalogValidationStats } from '@/lib/telemetry'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      ok: true,
      database: 'connected',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      catalogValidation: getCatalogValidationStats(),
    })
  } catch (error) {
    console.error('Health check failed', error)
    return NextResponse.json(
      {
        ok: false,
        database: 'unreachable',
        error: 'Unable to reach Postgres via Prisma',
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

