/**
 * Format amount from minor units to display string
 * @param amountMinor Amount in minor units (e.g., 10000 = $100.00)
 * @param currency Currency code (e.g., "USD", "EUR")
 * @returns Formatted string (e.g., "$100.00" or "€100.00")
 */
export function formatAmount(amountMinor: number, currency: string = 'USD'): string {
  const amount = amountMinor / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount)
}

