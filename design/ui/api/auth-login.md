[← Back to Sign In](../signin.md#api-login)

# POST /api/auth/login

**Endpoint:** `POST /api/auth/login`  
**Rate limit:** 5 failed attempts per email/15min, 10 per IP/15min  
**Account lockout:** 15 minutes after 5 failed attempts  
**Description:** Login with email/password (sets persistent HTTP-only cookie)

## Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Fields:**
- `email` (string, required) - User's email address
- `password` (string, required) - User's password

## Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "emailVerifiedAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Notes:**
- Session cookie is set automatically as a persistent HTTP-only cookie.
- The app does not impose a session expiry. The session remains valid until explicit logout, account deletion, token replacement, or browser cookie clearing.
- Verify credentials, create session, set cookie.
