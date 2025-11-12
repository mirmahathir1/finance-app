[← Back to Reset Password](../reset-password.md#api-reset-password)

# POST /api/auth/reset-password

**Endpoint:** `POST /api/auth/reset-password`  
**Rate limit:** 5 per email/hour, 10 per IP/hour  
**Description:** Reset password with token and new password

## Request Body

```json
{
  "token": "reset-token",
  "password": "SecurePassword123!"
}
```

**Fields:**
- `token` (string, required) - Password reset token from email link
- `password` (string, required) - New password (minimum 8 characters, must contain uppercase, lowercase, number, and special character)

## Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "emailVerifiedAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  },
  "message": "Password reset successfully"
}
```

**Notes:**
- Accepts `{ token, password }`, verifies token, updates password hash, invalidates token
- Token verification: JWT is decoded and validated (signature, expiration). The `passwordHash` claim in the token is compared with the current `password_hash` in the database. If they don't match, the token is rejected (already used or password changed).
- After successful password reset, the password hash is updated, automatically invalidating all existing reset tokens for that user.

