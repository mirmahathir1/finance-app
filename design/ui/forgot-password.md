[← Back to README](README.md)

# Forgot Password

<pre>
┌─────────────────────────────────────────────────────────┐
│                                                          │
│                    [App Logo]                            │
│                                                          │
│              Reset Your Password                          │
│         Enter your email to receive a reset link         │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Forgot Password                                   │ │
│  │                                                    │ │
│  │ Email Address                                     │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ user@example.com                             │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │ ℹ️  We'll send you a password reset link to      │ │
│  │     your email address.                           │ │
│  │                                                    │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │          Send Reset Link                      │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Remember your password?                           │ │
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
│  │  We've sent a password reset link to:             │ │
│  │  user@example.com                                  │ │
│  │                                                    │ │
│  │  Please check your inbox and click the link       │ │
│  │  to reset your password.                           │ │
│  │                                                    │ │
│  │  The link will expire in 15 minutes.              │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │        Resend Reset Link                       │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  Didn't receive the email?                        │ │
│  │  • Check your spam folder                         │ │
│  │  • Make sure you entered the correct email        │ │
│  │  • Wait a few minutes and try resending          │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

## Features

- **Email-only request**: Users only need to provide their email address
- **Generic success message**: Always shows success to prevent email enumeration
- **Resend link**: Option to resend reset link with rate limiting (5 requests per email per hour)
- **Clear instructions**: Explains what happens next and where to find the email
- **Expiration notice**: Informs users that the link expires in 15 minutes
- **Link to sign in**: Easy navigation for users who remember their password

## User Flow

1. User enters email address
2. Clicks "Send Reset Link"
3. System sends email via Brevo with password reset link
4. User sees "Check Your Email" confirmation screen
5. User clicks link in email → Redirects to reset password page
6. After resetting password → Redirects to sign in page

## Error Handling

- **Rate limiting**: Shows appropriate message if user exceeds rate limit (5 requests per email per hour)
- **Invalid email format**: Shows inline validation error
- **Resend errors**: Shows error message with guidance

## Forgot Password Flow

1. Sign In Page → Click "Forgot password?"
2. Forgot Password Form (Email only)
3. POST /api/auth/forgot-password/request
4. Send Brevo email with reset link https://your.app/reset-password?token=...
5. User clicks link
6. GET /api/auth/reset-password/verify?token=...
7. On success: Show reset password form
8. User enters new password and confirms
9. POST /api/auth/reset-password with { token, password }
10. On success: Update password_hash, invalidate token
11. Redirect to Sign In page

**UX Notes:**
- Always show a generic success after requesting a reset link (avoid email enumeration).
- Provide "Resend link" with rate limiting (5 requests per email per hour).
- Reset links expire after 15 minutes.
- Reset tokens are single-use (invalidated after successful password reset).
- Handle expired/invalid tokens with a clear message and a CTA to request a new link.
- Password requirements are clearly displayed and validated in real-time.
- Password strength indicator provides visual feedback.

## API Endpoints

<a id="api-endpoints"></a>

<a id="api-forgot-password-request"></a>

### Forgot Password Request
- `POST /api/auth/forgot-password/request` — See [API Response Documentation](./api/auth-forgot-password-request.md)

**Note:** In Guest Mode, API calls are intercepted client-side and return mock data generated in the browser using Faker.js. No server requests are made in Guest Mode.

## Security Notes

- Always returns success response to prevent email enumeration
- Reset link expires after 15 minutes
- Reset tokens are single-use (invalidated after successful reset)
- Rate limiting prevents abuse of the reset functionality (5 requests per email per hour, 10 per IP per hour)
- Rate limit response: Always return 200 OK (generic success) to prevent email enumeration, but track rate limits internally
- Storage: Track attempts by email and IP in Redis or in-memory store with TTL

## Token Invalidation Implementation

Reset tokens are JWT-based (signed with `RESET_PASSWORD_JWT_SECRET`) and are invalidated after successful password reset using one of the following approaches:

### Password Hash in Token Payload
The JWT payload includes the user's current `password_hash`. When the password is reset:
1. The password hash in the database is updated
2. Any existing reset tokens (which contain the old password hash) become invalid automatically
3. Token verification compares the hash in the token with the current hash in the database
4. If they don't match, the token is rejected

**JWT Payload Structure:**
```json
{
  "email": "user@example.com",
  "passwordHash": "current_password_hash_from_db",
  "exp": 1234567890,
  "iat": 1234567800
}
```

