[← Back to README](README.md)

# Reset Password

<pre>
Verifying reset token (loading state):

┌─────────────────────────────────────────────────────────┐
│                                                          │
│                    [App Logo]                            │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │         Verifying Reset Link...                   │ │
│  │                                                    │ │
│  │  [Loading spinner]                                 │ │
│  │                                                    │ │
│  │  Please wait while we verify your reset link.     │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘

Reset password form:

┌─────────────────────────────────────────────────────────┐
│                                                          │
│                    [App Logo]                            │
│                                                          │
│              Reset Your Password                         │
│         Create a new secure password                     │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Reset Password                                    │ │
│  │                                                    │ │
│  │ New Password                                      │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ ••••••••••                                   │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │ Password Requirements:                            │ │
│  │ • At least 8 characters                          │ │
│  │ • Contains uppercase and lowercase letters       │ │
│  │ • Contains at least one number                   │ │
│  │ • Contains at least one special character        │ │
│  │                                                    │ │
│  │ Confirm New Password                              │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ ••••••••••                                   │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │ [ ] Show passwords                                │ │
│  │                                                    │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │          Reset Password                       │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Password strength indicator:                       │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ ████░░░░░░  Medium                            │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘

After successful password reset:

┌─────────────────────────────────────────────────────────┐
│                                                          │
│                    [App Logo]                            │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │         ✓ Password Reset Successfully!             │ │
│  │                                                    │ │
│  │  Your password has been reset successfully.      │ │
│  │  You can now sign in with your new password.     │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │         Continue to Sign In                    │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  <a href="./signin.md">Sign In</a>                                    │ │
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
│  │         ⚠️  Reset Link Invalid or Expired          │ │
│  │                                                    │ │
│  │  This reset link is invalid or has expired.       │ │
│  │                                                    │ │
│  │  This can happen if:                              │ │
│  │  • The link has expired (links expire after        │ │
│  │    15 minutes)                                     │ │
│  │  • The link has already been used                 │ │
│  │  • The link is invalid                             │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │      Request New Reset Link                    │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  Or return to:                                      │ │
│  │  <a href="./forgot-password.md">Forgot Password</a>                          │ │
│  │  <a href="./signin.md">Sign In</a>                                  │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

## Features

- **Automatic token verification**: Verifies reset token from URL query parameter on page load
- **Loading state**: Shows spinner while verifying token
- **Password requirements**: Clear list of password requirements displayed
- **Password strength indicator**: Visual feedback on password strength (weak/medium/strong)
- **Show/hide passwords**: Toggle to show or hide password fields
- **Real-time validation**: Validates password as user types
- **Confirm password**: Ensures passwords match before submission
- **Auto-redirect**: Automatically redirects to sign in page after successful password reset
- **Error handling**: Clear messages for expired, invalid, or already-used tokens

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

## User Flow

1. User clicks reset link from email
2. Page loads with token in URL (`/reset-password?token=...`)
3. System verifies token via `GET /api/auth/reset-password/verify?token=...`
4. On success:
   - Shows reset password form
   - User enters new password and confirms it
   - System validates password requirements
   - On submit: Calls `POST /api/auth/reset-password` with token and new password
   - Password is hashed and updated in database
   - Reset token is invalidated
   - Redirects to sign in page
5. On error:
   - Shows appropriate error message
   - Provides option to request new reset link or return to forgot password page

## Error Handling

- **Invalid token**: Shows generic error message (doesn't reveal if token is invalid or expired)
- **Expired token**: Shows expiration message with option to request new link
- **Already used token**: Shows friendly message with link to request new reset link
- **Password mismatch**: Shows error when passwords don't match
- **Weak password**: Shows which requirements are not met
- **Rate limiting**: Shows message if attempts exceed limit (5 per email per hour)

## Reset Password Flow

1. User clicks reset link from email
2. Page loads with token in URL (`/reset-password?token=...`)
3. System verifies token via `GET /api/auth/reset-password/verify?token=...`
4. On success:
   - Shows reset password form
   - User enters new password and confirms it
   - System validates password requirements
   - On submit: Calls `POST /api/auth/reset-password` with token and new password
   - Password is hashed and updated in database
   - Reset token is invalidated
   - Redirects to sign in page
5. On error:
   - Shows appropriate error message
   - Provides option to request new reset link or return to forgot password page

## API Endpoints

<a id="api-endpoints"></a>

<a id="api-reset-password-verify"></a>

### Reset Password Verify
- `GET /api/auth/reset-password/verify?token=` — See [API Response Documentation](./api/auth-reset-password-verify.md)

<a id="api-reset-password"></a>

### Reset Password
- `POST /api/auth/reset-password` — See [API Response Documentation](./api/auth-reset-password.md)

**Note:** In Guest Mode, API calls are intercepted client-side and return mock data generated in the browser using Faker.js. No server requests are made in Guest Mode.

## Security Notes

- Password is never sent in plain text (always hashed server-side)
- Password strength is calculated client-side for UX only
- Server enforces all password requirements
- Rate limiting prevents brute force attacks (5 attempts per email per hour, 10 per IP per hour)
- Rate limit response: Return 429 Too Many Requests with `Retry-After` header
- Reset tokens are single-use and expire after 15 minutes
- Reset tokens are invalidated immediately after successful password reset
- All reset attempts are logged for security monitoring
- Failed attempts should not reveal whether the token is invalid or expired (generic error message)

## Token Invalidation Implementation

Reset tokens are JWT-based and include the user's current `password_hash` in the token payload. When the password is reset:

1. The password hash in the database is updated
2. Any existing reset tokens (which contain the old password hash) become invalid automatically
3. Token verification compares the hash in the token with the current hash in the database
4. If they don't match, the token is rejected

This approach ensures tokens are automatically invalidated without requiring a separate database table or Redis blacklist. See [Forgot Password](./forgot-password.md#token-invalidation-implementation) for more details.

