[← Back to README](README.md)

# Authentication & Security

## Authentication Flow

### Guest Mode
Users can access the application in Guest Mode without authentication. When Guest Mode is activated:
- All UI features render fake data generated client-side (no database access)
- All API routes are replaced with corresponding guest routes that return mock data
- A floating icon appears on the right side of the screen indicating Guest Mode is active
- Guest Mode state is stored in browser session/localStorage
- Users can exit Guest Mode at any time to return to the login page

**Guest Mode Features:**
- No authentication required
- All data is generated using a JavaScript library (e.g., Faker.js) for realistic fake data
- Full UI functionality available with mock data
- No data persistence (all data is ephemeral and lost on page refresh)
- Guest routes mirror all regular API endpoints but return generated data

### Signup via Email Verification (Brevo) + Password with PostgreSQL (Neon)
1. User navigates to Sign Up or Sign In.
2. Sign Up (No DB write before verification):
   - Frontend calls `POST /api/auth/signup/request` with the email.
   - Backend creates a short‑lived JWT containing `email` and `exp` (e.g., 15 minutes), signed with a dedicated secret.
   - Backend sends an email via Brevo with a verification link: `https://your.app/verify?token=...`.
   - User clicks the link. Backend verifies the JWT on `GET /api/auth/verify?token=...`.
   - Only after successful verification:
     - Create the user in `users` with the provided email (idempotent: if the user already exists and is verified, return success).
     - Set `email_verified_at = now()`.
     - Proceed with signup completion (e.g., prompt user to set a password) or issue a session to continue onboarding.
3. Sign In:
   - Submit email and password.
   - Server verifies credentials, then issues session:
     - Option A: Create `sessions` row with random opaque token (store hash); set HTTP-only cookie.
     - Option B: Issue short-lived JWT and persist refresh token in DB.
4. Authenticated requests include the session cookie (or JWT). Middleware loads user from DB and attaches to request context.
5. Logout invalidates the session (delete session row and clear cookie).

#### Notes
- The signup token is short-lived and signed; no database writes occur before verification (prevents storing unverified users).
- The `/signup/request` endpoint must be non-enumerating: always return a generic success response regardless of whether the email is already registered.
- Re-clicking an already used or expired link should surface a friendly error and allow requesting a new link.

### Session Management
- HTTP-only cookie for session; `Secure` in production and `SameSite=Lax` or `Strict`.
- Session expiry: 7–30 days (configurable). Idle timeout recommended.
- Refresh token rotation if using JWT; otherwise rotate opaque session tokens periodically.
- Store only token hashes in DB to prevent token leakage.

## Security Considerations

### Data Privacy
- User account, profile, and application data are stored in PostgreSQL (Neon).
- Only minimal user PII is stored (e.g., email). No profile photo storage.
- Users can only access rows they own; enforce row-level authorization in service layer.

### API Security
- CSRF protection for state-changing requests (double-submit cookie or CSRF token).
- Rate limiting on API routes
- Input validation and sanitization
- SQL injection prevention (parameterized queries/ORM)

### Rate Limiting for Authentication Routes

Rate limiting is critical for authentication endpoints to prevent brute force attacks, credential stuffing, and abuse. The following limits should be enforced:

#### Signup Request (`POST /api/auth/signup/request`)
- **Limit**: 5 requests per email address per hour
- **Limit**: 10 requests per IP address per hour
- **Rationale**: Prevents email enumeration and spam/abuse of the email verification system
- **Response**: Return 429 Too Many Requests with `Retry-After` header
- **Storage**: Track attempts by email and IP in Redis or in-memory store with TTL

#### Email Verification (`GET /api/auth/verify?token=`)
- **Limit**: 10 verification attempts per IP address per hour
- **Rationale**: Prevents brute force attempts on verification tokens
- **Response**: Return 429 Too Many Requests with `Retry-After` header
- **Note**: Failed attempts should not reveal whether the token is invalid or expired (generic error message)

#### Login (`POST /api/auth/login`)
- **Limit**: 5 failed login attempts per email address per 15 minutes
- **Limit**: 10 failed login attempts per IP address per 15 minutes
- **Rationale**: Prevents brute force attacks on user credentials
- **Response**: Return 429 Too Many Requests with `Retry-After` header after limit exceeded
- **Account Lockout**: After 5 failed attempts for an email, lock the account for 15 minutes (optional but recommended)
- **Storage**: Track failed attempts by email and IP; reset on successful login

#### Set Password (`POST /api/auth/set-password`)
- **Limit**: 5 attempts per email address per hour
- **Limit**: 10 attempts per IP address per hour
- **Rationale**: Prevents brute force attempts during password setup
- **Response**: Return 429 Too Many Requests with `Retry-After` header

#### Logout (`POST /api/auth/logout`)
- **Limit**: 20 requests per IP address per minute
- **Rationale**: Prevents abuse but allows legitimate logout requests
- **Response**: Return 429 Too Many Requests with `Retry-After` header

#### Session Check (`GET /api/auth/session`)
- **Limit**: 60 requests per IP address per minute
- **Rationale**: Allows frequent session checks while preventing abuse
- **Response**: Return 429 Too Many Requests with `Retry-After` header

#### Implementation Notes
- Use Redis or an in-memory store (e.g., `node-rate-limiter-flexible`, `express-rate-limit`) for tracking attempts
- Rate limit keys should combine endpoint + identifier (email/IP) for granular control
- Include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers in responses
- Log rate limit violations for security monitoring
- Consider implementing progressive delays (exponential backoff) for repeated violations

### Authorization
- Role-based access control (RBAC) with `roles` and `user_roles` tables (or a `role` column).
- Fine-grained checks at the service layer per route/action.

## Error Handling

### Client-Side Errors
- Form validation errors: Display inline below fields
- Network errors: Show snackbar with retry option
- Authentication errors: Show inline errors; throttle repeated failures

### Server-Side Errors
- 401 Unauthorized: Re-authenticate
- 403 Forbidden: Show permission error
- 404 Not Found: Show empty state
- 500 Server Error: Show error page with support info

### Logging
- Client: Console errors in development
- Server: Structured logging with timestamps
- Production: Error tracking service (optional)

## Database Schema (Auth)

### Tables
- `users`
  - `id` UUID primary key
  - `email` text unique not null
  - `password_hash` text not null
  - `email_verified_at` timestamptz null
  - `created_at` timestamptz default now()
  - `updated_at` timestamptz default now()
- `sessions` (if using opaque tokens)
  - `id` UUID primary key
  - `user_id` UUID references `users(id)` on delete cascade
  - `token_hash` text unique not null
  - `expires_at` timestamptz not null
  - `created_at` timestamptz default now()
- `roles` (optional)
  - `id` serial primary key
  - `name` text unique not null
- `user_roles` (optional)
  - `user_id` UUID references `users(id)` on delete cascade
  - `role_id` int references `roles(id)` on delete cascade
  - primary key (`user_id`, `role_id`)

## Auth Endpoints
- `POST /api/auth/signup/request` — Request signup verification link (Brevo). Accepts `{ email }`, creates short-lived signed token, emails verification link. Always returns 200 to avoid user enumeration.
- `GET /api/auth/verify?token=` — Verify token. On success, create user if not exists, set `email_verified_at`, and continue session/onboarding.
- `POST /api/auth/set-password` — (If required) Set or finalize password after verification.
- `POST /api/auth/login` — Verify credentials, create session/JWT, set cookie.
- `POST /api/auth/logout` — Invalidate current session, clear cookie.
- `GET /api/auth/session` — Return authenticated user context.
- `POST /api/auth/guest-mode` — Activate guest mode (sets guest mode flag in session/localStorage).
- `POST /api/auth/exit-guest-mode` — Exit guest mode and return to login page.

### Environment Variables
```
DATABASE_URL=postgres://user:password@host:port/dbname?sslmode=require  # Neon connection string
SESSION_COOKIE_NAME=app_session
JWT_SECRET=your_jwt_secret_if_applicable
# Signup email verification
SIGNUP_JWT_SECRET=your_signup_jwt_secret
SIGNUP_JWT_TTL_MINUTES=15
APP_BASE_URL=https://your.app
VERIFY_ROUTE_PATH=/verify
# Brevo (Sendinblue)
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=no-reply@your.app
BREVO_SENDER_NAME=Your App
```
