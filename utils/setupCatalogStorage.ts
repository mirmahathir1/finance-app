import type { SetupCatalogData } from '@/types'

const STORAGE_KEY = 'setup-catalog-summary'

export function loadSetupCatalogSummary(): SetupCatalogData | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as SetupCatalogData
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function persistSetupCatalogSummary(
  summary: SetupCatalogData | null
): void {
  if (typeof window === 'undefined') {
    return
  }

  if (!summary) {
    sessionStorage.removeItem(STORAGE_KEY)
    return
  }

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(summary))
}

