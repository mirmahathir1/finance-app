[← Back to README](README.md)

# Email Verification

<pre>
Verifying email (loading state):

┌─────────────────────────────────────────────────────────┐
│                                                          │
│                    [App Logo]                            │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │            Verifying Your Email...                 │ │
│  │                                                    │ │
│  │  [Loading spinner]                                 │ │
│  │                                                    │ │
│  │  Please wait while we verify your email address.  │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘

Success state:

┌─────────────────────────────────────────────────────────┐
│                                                          │
│                    [App Logo]                            │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │              ✓ Email Verified!                    │ │
│  │                                                    │ │
│  │  Your email address has been successfully         │ │
│  │  verified. You can now set your password and      │ │
│  │  start using the app.                             │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │         Set Your Password                      │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │         <a href="./signin.md">Sign In</a>                          │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘

Error state - Invalid/Expired token:

┌─────────────────────────────────────────────────────────┐
│                                                          │
│                    [App Logo]                            │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │              ⚠️  Verification Failed               │ │
│  │                                                    │ │
│  │  This verification link is invalid or has expired.│ │
│  │                                                    │ │
│  │  This can happen if:                               │ │
│  │  • The link has expired (links expire after       │ │
│  │    15 minutes)                                     │ │
│  │  • The link has already been used                 │ │
│  │  • The link is invalid                             │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │      Request New Verification Link             │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  Or return to:                                      │ │
│  │  <a href="./signup.md">Sign Up</a>                                  │ │
│  │  <a href="./signin.md">Sign In</a>                                  │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘

Error state - Already verified:

┌─────────────────────────────────────────────────────────┐
│                                                          │
│                    [App Logo]                            │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │              ℹ️  Already Verified                  │ │
│  │                                                    │ │
│  │  Your email address has already been verified.     │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │  <a href="./signin.md">Sign In</a> │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

## Features

- **Automatic verification**: Verifies token from URL query parameter on page load
- **Loading state**: Shows spinner while verifying
- **Success state**: Confirms verification and redirects to set password page
- **Error handling**: Clear messages for expired, invalid, or already-used tokens
- **Recovery options**: Allows requesting a new verification link or returning to sign up
- **Already verified**: Handles case where user clicks link again after verification, redirects to sign in

## User Flow

1. User clicks verification link from email
2. Page loads with token in URL (`/verify?token=...`)
3. System verifies token via `GET /api/auth/verify?token=...`
4. On success:
   - Creates user in database (if not exists)
   - Sets `email_verified_at` timestamp
   - Starts session
   - Redirects to set password page
5. On error:
   - Shows appropriate error message
   - Provides option to request new link or return to sign up

## Email Verification Flow

1. User clicks verification link from email
2. Page loads with token in URL (`/verify?token=...`)
3. System verifies token via `GET /api/auth/verify?token=...`
4. On success:
   - Creates user in database (if not exists)
   - Sets `email_verified_at` timestamp
   - Starts session
   - Redirects to set password page
5. On error:
   - Shows appropriate error message
   - Provides option to request new link or return to sign up

## Error Handling

- **Invalid token**: Shows generic error message (doesn't reveal if token is invalid or expired)
- **Expired token**: Shows expiration message with option to request new link
- **Already verified**: Shows friendly message with link to sign in page
- **Rate limiting**: Shows message if verification attempts exceed limit (10 per IP per hour)

## API Endpoints

<a id="api-endpoints"></a>

<a id="api-email-verification"></a>

### Email Verification
- `GET /api/auth/verify?token=` — See [API Response Documentation](./api/auth-verify.md)

**Note:** In Guest Mode, API calls are intercepted client-side and return mock data generated in the browser using Faker.js. No server requests are made in Guest Mode.

## Security Notes

- Verification token is short-lived (15 minutes) and signed
- No database writes occur before verification
- Rate limiting: 10 verification attempts per IP address per hour
- Rate limit response: Return 429 Too Many Requests with `Retry-After` header
- Failed attempts should not reveal whether the token is invalid or expired (generic error message)
- User is created only after successful verification
- Idempotent: if the user already exists and is verified, return success

