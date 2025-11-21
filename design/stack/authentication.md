[← Back to README](README.md)

# Authentication

## Overview

### Database-backed Authentication (PostgreSQL on Supabase)
- Use a first-party credentials flow (email + password) backed by PostgreSQL (Supabase).
- Store users in a `users` table with a strong password hash (Argon2id preferred; bcrypt as fallback).
- Manage sessions via an HTTP-only cookie:
  - Option A: Server-side sessions table (`sessions`) with opaque, random tokens (store only token hashes).
  - Option B: Short-lived JWT with rotation and refresh tokens persisted in DB.
- Provide endpoints for signup request (email verification), verify, login, logout, and session refresh.
- Email verification is mandatory: use Brevo to send a signed, short‑lived verification link. Do not write to the database before verification succeeds.
- Include password setup after verification and password reset flows.

### Notes
- Keep authentication concerns decoupled from app-specific authorization logic.
- Store tokens securely (HTTP-only, Secure, SameSite) and enforce CSRF protection on state-changing routes.
- Enforce sensible policies: password strength, login throttling/rate limits, and account lockout/backoff.

## Rate Limiting Implementation

### Recommended Libraries
- **Node.js/Express**: `express-rate-limit` or `rate-limiter-flexible`
- **Redis-backed**: Use `rate-limiter-flexible` with Redis adapter for distributed rate limiting
- **In-memory**: Use `express-rate-limit` with memory store for single-instance deployments

### Configuration Example (express-rate-limit)

```javascript
// Signup request rate limiter
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per email
  keyGenerator: (req) => req.body.email || req.ip,
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
});

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts
  keyGenerator: (req) => req.body.email || req.ip,
  skipSuccessfulRequests: true, // Only count failed attempts
  standardHeaders: true,
  legacyHeaders: false,
});

// IP-based rate limiter (fallback)
const ipLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Redis-backed Rate Limiting (rate-limiter-flexible)

For production deployments with multiple instances, use Redis:

```javascript
const { RateLimiterRedis } = require('rate-limiter-flexible');
const redis = require('redis');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

// Login rate limiter with Redis
const loginRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_fail',
  points: 5, // 5 attempts
  duration: 900, // 15 minutes
  blockDuration: 900, // Block for 15 minutes after limit
});

// Apply middleware
app.post('/api/auth/login', async (req, res, next) => {
  try {
    await loginRateLimiter.consume(req.body.email || req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too many login attempts',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000),
    });
  }
});
```

### Rate Limit Headers

All rate-limited endpoints should include standard headers:
- `X-RateLimit-Limit`: Maximum number of requests allowed
- `X-RateLimit-Remaining`: Number of requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the rate limit resets
- `Retry-After`: Seconds to wait before retrying (for 429 responses)

### Environment Variables

```
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REDIS_URL=redis://localhost:6379  # Optional, for distributed rate limiting
RATE_LIMIT_SIGNUP_PER_EMAIL=5
RATE_LIMIT_SIGNUP_PER_IP=10
RATE_LIMIT_LOGIN_PER_EMAIL=5
RATE_LIMIT_LOGIN_PER_IP=10
RATE_LIMIT_VERIFY_PER_IP=10
RATE_LIMIT_SET_PASSWORD_PER_EMAIL=5
RATE_LIMIT_SET_PASSWORD_PER_IP=10
```

## Email Verification (Brevo) Implementation

- Token format: Short‑lived JWT containing `email` and `exp` (e.g., 15 minutes), signed with a dedicated `SIGNUP_JWT_SECRET`.
- Email delivery: Use Brevo transactional emails to send a link like `https://your.app/verify?token=...`.
- Security:
  - No DB writes before verification (prevents unverified user records).
  - The signup request endpoint must be non-enumerating and always return a generic success.
  - Verification is idempotent: if a verified account already exists for the email, return success.
  - Expired or invalid tokens return a safe error and provide a way to request a new link.
- Post-verification:
  - Create the `users` row, set `email_verified_at = now()`.
  - Optionally issue a session immediately and prompt for password creation, or require an immediate password setup step via a protected endpoint.

### Environment
- `SIGNUP_JWT_SECRET`, `SIGNUP_JWT_TTL_MINUTES`
- `APP_BASE_URL`, `VERIFY_ROUTE_PATH`
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`

