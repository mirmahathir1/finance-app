[← Back to README](README.md)

# Sign Up

<pre>
┌─────────────────────────────────────────────────────────┐
│                                                          │
│                    [App Logo]                            │
│                                                          │
│              Create Your Account                         │
│         Start tracking your finances today               │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Sign Up                                           │ │
│  │                                                    │ │
│  │ Email Address                                     │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ user@example.com                             │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │ ℹ️  We'll send you a verification link to         │ │
│  │     confirm your email address.                   │ │
│  │                                                    │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │          <a href="./mock-email.md">Send Verification Link</a>                │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │         ───────────  OR  ───────────              │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │     ┌──────────────────────────────────────┐      │ │
│  │     │   <a href="./guest.md">Continue as Guest</a>                  │      │ │
│  │     │   (Explore with demo data)           │      │ │
│  │     └──────────────────────────────────────┘      │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Already have an account?                           │ │
│  │ <a href="./signin.md">Sign In</a>                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘

After submitting email:

┌─────────────────────────────────────────────────────────┐
│                                                          │
│                    [App Logo]                            │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │              ✓ Check Your Email                   │ │
│  │                                                    │ │
│  │  We've sent a verification link to:                │ │
│  │  user@example.com                                  │ │
│  │                                                    │ │
│  │  Please check your inbox and click the link       │ │
│  │  to verify your email address.                     │ │
│  │                                                    │ │
│  │  The link will expire in 15 minutes.              │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │        Resend Verification Link                │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  Didn't receive the email?                           │ │
│  │  • Check your spam folder                          │ │
│  │  • Make sure you entered the correct email        │ │
│  │  • Wait a few minutes and try resending           │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Need help?                                         │ │
│  │ [Contact Support]                                  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

## Features

- **Email-only signup**: Users only need to provide their email address initially
- **Generic success message**: Always shows success to prevent email enumeration
- **Resend link**: Option to resend verification link with rate limiting (5 requests per email per hour)
- **Clear instructions**: Explains what happens next and where to find the email
- **Expiration notice**: Informs users that the link expires in 15 minutes
- **Guest mode option**: Users can explore the app without creating an account
- **Link to sign in**: Easy navigation for existing users

## User Flow

1. User enters email address
2. Clicks "Send Verification Link"
3. System sends email via Brevo with verification link
4. User sees "Check Your Email" confirmation screen
5. User clicks link in email → Redirects to verification page
6. After verification → Redirects to set password page
7. After setting password → Redirects to setup page

## Sign Up Verification Flow (No DB write before verification)

1. Signup Form (Email only)
2. POST /api/auth/signup/request
3. Send Brevo email with link https://your.app/verify?token=...
4. User clicks link
5. GET /api/auth/verify?token=...
6. On success: create user, mark email_verified_at, start session or prompt Set Password
7. Continue onboarding

**UX Notes:**
- Always show a generic success after requesting a link (avoid email enumeration).
- Provide "Resend link" with rate limiting.
- Handle expired/invalid tokens with a clear message and a CTA to request a new link.

## Error Handling

- **Rate limiting**: Shows appropriate message if user exceeds rate limit (5 requests per email per hour, 10 per IP per hour)
- **Invalid email format**: Shows inline validation error
- **Resend errors**: Shows error message with guidance
- **Generic success**: Always returns success to prevent email enumeration

## API Endpoints

<a id="api-endpoints"></a>

<a id="api-signup-request"></a>

### Signup Request
- `POST /api/auth/signup/request` — See [API Response Documentation](./api/auth-signup-request.md)

**Note:** In Guest Mode, API calls are intercepted client-side and return mock data generated in the browser using Faker.js. No server requests are made in Guest Mode.

## Security Notes

- No database writes occur before email verification (prevents storing unverified users)
- Signup token is short-lived (15 minutes) and signed
- The `/signup/request` endpoint must be non-enumerating: always return a generic success response regardless of whether the email is already registered
- Re-clicking an already used or expired link should surface a friendly error and allow requesting a new link
- Rate limiting: 5 requests per email per hour, 10 requests per IP per hour
- Rate limit response: Return 429 Too Many Requests with `Retry-After` header
- Storage: Track attempts by email and IP in Redis or in-memory store with TTL

