[← Back to README](README.md)

# Sign In

<pre>
┌─────────────────────────────────────────────────────────┐
│                                                          │
│                    [App Logo]                            │
│                                                          │
│              Welcome to Finance App                      │
│         Track your expenses and income                   │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Sign In                                           │  │
│  │                                                    │  │
│  │ Email Address                                     │  │
│  │ ┌──────────────────────────────────────────────┐  │  │
│  │ │ user@example.com                             │  │  │
│  │ └──────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  │ Password                                          │  │
│  │ ┌──────────────────────────────────────────────┐  │  │
│  │ │ ••••••••••                                   │  │  │
│  │ └──────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  │ [ ] Remember me                                   │  │
│  │                                                    │  │
│  │ ┌──────────────────────────────────────────────┐  │  │
│  │ │          <a href="./dashboard.md">Sign In</a>                              │  │  │
│  │ └──────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  │ <a href="./forgot-password.md">Forgot password?</a>                                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │         ───────────  OR  ───────────              │  │
│  │                                                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │     ┌──────────────────────────────────────┐      │  │
│  │     │   <a href="./guest.md">Continue as Guest</a>                  │      │  │
│  │     │   (Explore with demo data)           │      │  │
│  │     └──────────────────────────────────────┘      │  │
│  │                                                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Don't have an account?                            │  │
│  │ <a href="./signup.md">Sign Up</a>                                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

## Component Structure

The Sign In page consists of:

```
SignIn
├── AppLogo
├── WelcomeMessage
├── EmailPasswordForm (email, password, submit)
├── GuestModeButton (prominent button: "Try Guest Mode" or "Continue as Guest")
└── InfoText (security and password guidance)
```

## Features

- **Email and Password Authentication**: Standard email/password login form
- **Remember Me**: Optional checkbox to persist session
- **Forgot Password Link**: Link to password reset flow
- **Guest Mode**: Prominent button to explore app without authentication
- **Sign Up Link**: Easy navigation to sign up page
- **Session Management**: HTTP-only cookie for secure session storage
- **Rate Limiting**: 5 failed login attempts per email per 15 minutes, 10 per IP per 15 minutes

## User Flow

1. User enters email and password
2. User optionally checks "Remember me"
3. User clicks "Sign In"
4. System verifies credentials via `POST /api/auth/login`
5. On success:
   - Creates session (HTTP-only cookie)
   - Redirects to Dashboard or Setup (if first time)
6. On error:
   - Shows inline error message
   - After 5 failed attempts: Account locked for 15 minutes
   - Shows rate limit message if exceeded

## Guest Mode

For detailed Guest Mode specifications, see [Guest Mode](./guest.md).

## Error Handling

- **Invalid credentials**: Shows generic error message (doesn't reveal if email exists)
- **Account locked**: Shows message after 5 failed attempts with lockout duration
- **Rate limiting**: Shows appropriate message if user exceeds rate limit
- **Session expired**: Redirects to sign in if session is invalid

## API Endpoints

<a id="api-endpoints"></a>

### Login

<a id="api-login"></a>
- `POST /api/auth/login` — See [API Response Documentation](./api/auth-login.md)

<a id="api-session-management"></a>

### Session Management
- `POST /api/auth/logout` — See [API Response Documentation](./api/auth-logout.md)
- `GET /api/auth/session` — See [API Response Documentation](./api/auth-session.md)

**Note:** In Guest Mode, API calls are intercepted client-side and return mock data generated in the browser using Faker.js. No server requests are made in Guest Mode.

## Session Management

- HTTP-only cookie for session; `Secure` in production and `SameSite=Lax` or `Strict`
- Session expiry: 30 days. Idle timeout recommended
- Refresh token rotation if using JWT; otherwise rotate opaque session tokens periodically
- Store only token hashes in DB to prevent token leakage
- Authenticated requests include the session cookie (or JWT). Middleware loads user from DB and attaches to request context

## Security Notes

- Always returns generic error for invalid credentials to prevent email enumeration
- Rate limiting prevents brute force attacks
- Account lockout after 5 failed attempts for 15 minutes
- Rate limit response: Return 429 Too Many Requests with `Retry-After` header after limit exceeded
- Storage: Track failed attempts by email and IP; reset on successful login
- Session stored in HTTP-only cookie (Secure in production, SameSite=Lax)
- Password is never sent in plain text (always hashed server-side)
- Failed login attempts are logged for security monitoring
