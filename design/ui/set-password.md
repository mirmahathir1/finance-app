[← Back to README](README.md)

# Set Password

<pre>
┌─────────────────────────────────────────────────────────┐
│                                                          │
│                    [App Logo]                            │
│                                                          │
│              Set Your Password                           │
│         Create a secure password for your account        │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Set Password                                     │ │
│  │                                                    │ │
│  │ Password                                          │ │
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
│  │ Confirm Password                                  │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ ••••••••••                                   │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │ [ ] Show passwords                                │ │
│  │                                                    │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │          Create Account                       │ │ │
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

After successful password set:

┌─────────────────────────────────────────────────────────┐
│                                                          │
│                    [App Logo]                            │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │              ✓ Password Set Successfully!          │ │
│  │                                                    │ │
│  │  Your account has been created successfully!     │ │
│  │  You can now sign in to continue.                 │ │
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
</pre>

## Features

- **Password requirements**: Clear list of password requirements displayed
- **Password strength indicator**: Visual feedback on password strength (weak/medium/strong)
- **Show/hide passwords**: Toggle to show or hide password fields
- **Real-time validation**: Validates password as user types
- **Confirm password**: Ensures passwords match before submission
- **Auto-redirect**: Automatically redirects to sign in page after successful password creation

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

## User Flow

1. User arrives from email verification page
2. User enters password and confirms it
3. System validates password requirements
4. On submit: Calls `POST /api/auth/set-password` with email and password
5. On success:
   - Password is hashed and stored in database
   - User account is created
   - Redirects to sign in page to continue
6. On error:
   - Shows inline validation errors

## Error Handling

- **Password mismatch**: Shows error when passwords don't match
- **Weak password**: Shows which requirements are not met
- **Rate limiting**: Shows message if attempts exceed limit (5 per email per hour)
- **Session expired**: Redirects to sign in if session is invalid

## Set Password Flow

1. User arrives from email verification page
2. User enters password and confirms it
3. System validates password requirements
4. On submit: Calls `POST /api/auth/set-password` with email and password
5. On success:
   - Password is hashed and stored in database
   - User account is created
   - Redirects to sign in page to continue
6. On error:
   - Shows inline validation errors

## API Endpoints

<a id="api-endpoints"></a>

<a id="api-set-password"></a>

### Set Password
- `POST /api/auth/set-password` — See [API Response Documentation](./api/auth-set-password.md)

**Note:** In Guest Mode, API calls are intercepted client-side and return mock data generated in the browser using Faker.js. No server requests are made in Guest Mode.

## Security Notes

- Password is never sent in plain text (always hashed server-side)
- Password strength is calculated client-side for UX only
- Server enforces all password requirements
- Rate limiting prevents brute force attacks (5 attempts per email per hour, 10 per IP per hour)
- Rate limit response: Return 429 Too Many Requests with `Retry-After` header
- Session is created only after successful password set

