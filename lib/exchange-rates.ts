export interface ExchangeRateApiResponse {
  result?: string
  rates?: Record<string, number>
  error?: string
}

export async function getConversionRates(
  baseCurrency: string
): Promise<Record<string, number>> {
  const normalized = baseCurrency.trim().toUpperCase()

  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${normalized}`)

    if (!response.ok) {
      return {}
    }

    const data: ExchangeRateApiResponse = await response.json()

    if (data.result === 'success' && data.rates) {
      return data.rates
    }

    return {}
  } catch {
    return {}
  }
}
