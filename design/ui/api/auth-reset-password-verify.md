[← Back to Reset Password](../reset-password.md#api-reset-password-verify)

# GET /api/auth/reset-password/verify

**Endpoint:** `GET /api/auth/reset-password/verify?token=`  
**Rate limit:** 10 per IP/hour  
**Description:** Verify reset token validity

## Query Parameters

- `token` (string, required) - Password reset token from email link

## Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "valid": true,
    "email": "user@example.com"
  }
}
```

**Notes:**
- Returns token status without resetting password
- Token verification: JWT is decoded and validated (signature, expiration). The `passwordHash` claim in the token is compared with the current `password_hash` in the database. If they don't match, the token is invalid (already used or password changed).
- This endpoint is used to verify token validity before showing the reset password form to the user.

