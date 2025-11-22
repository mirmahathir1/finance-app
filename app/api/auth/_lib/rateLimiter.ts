/**
 * Rate limiter for email-based requests
 * Tracks requests per email address with a sliding window
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store: email -> rate limit entry
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [email, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(email)
    }
  }
}, CLEANUP_INTERVAL_MS)

/**
 * Check if an email address has exceeded the rate limit
 * @param email - The email address to check
 * @param maxRequests - Maximum number of requests allowed (default: 3)
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns Object with `allowed` boolean and `retryAfter` seconds if rate limited
 */
export function checkRateLimit(
  email: string,
  maxRequests: number = 3,
  windowMs: number = 60 * 1000
): { allowed: boolean; retryAfter?: number } {
  const normalizedEmail = email.toLowerCase().trim()
  const now = Date.now()
  const entry = rateLimitStore.get(normalizedEmail)

  // No entry exists or window has expired
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(normalizedEmail, {
      count: 1,
      resetAt: now + windowMs,
    })
    return { allowed: true }
  }

  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  // Increment count
  entry.count++
  return { allowed: true }
}

