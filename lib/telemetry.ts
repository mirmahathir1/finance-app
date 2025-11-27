type CatalogValidationField = 'profile' | 'currency' | 'tags' | 'type'
type CatalogValidationSource = 'transactions.create' | 'transactions.update'

interface CatalogValidationStats {
  total: number
  sources: Record<
    CatalogValidationSource,
    Record<CatalogValidationField, number>
  >
  lastEvent?: {
    source: CatalogValidationSource
    field: CatalogValidationField
    timestamp: string
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __catalogValidationStats: CatalogValidationStats | undefined
}

function createEmptyStats(): CatalogValidationStats {
  return {
    total: 0,
    sources: {
      'transactions.create': {
        profile: 0,
        currency: 0,
        tags: 0,
        type: 0,
      },
      'transactions.update': {
        profile: 0,
        currency: 0,
        tags: 0,
        type: 0,
      },
    },
  }
}

function getStatsStore(): CatalogValidationStats {
  if (!globalThis.__catalogValidationStats) {
    globalThis.__catalogValidationStats = createEmptyStats()
  }
  return globalThis.__catalogValidationStats
}

export function recordCatalogValidationFailure(
  field: CatalogValidationField,
  source: CatalogValidationSource
) {
  const stats = getStatsStore()
  stats.total += 1
  stats.sources[source][field] += 1
  stats.lastEvent = {
    source,
    field,
    timestamp: new Date().toISOString(),
  }

}

export function getCatalogValidationStats(): CatalogValidationStats {
  const stats = getStatsStore()
  return {
    total: stats.total,
    sources: {
      'transactions.create': { ...stats.sources['transactions.create'] },
      'transactions.update': { ...stats.sources['transactions.update'] },
    },
    lastEvent: stats.lastEvent ? { ...stats.lastEvent } : undefined,
  }
}


