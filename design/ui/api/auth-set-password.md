[← Back to Set Password](../set-password.md#api-set-password)

# POST /api/auth/set-password

**Endpoint:** `POST /api/auth/set-password`  
**Rate limit:** 5 per email/hour, 10 per IP/hour  
**Description:** Set password after verification (if required)

## Request Body

```json
{
  "token": "verification-token",
  "password": "SecurePassword123!"
}
```

**Alternative Request Body (if using email):**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Fields:**
- `token` (string, optional) - Verification token (if using token-based flow)
- `email` (string, optional) - User's email address (if using email-based flow)
- `password` (string, required) - New password (minimum 8 characters, must contain uppercase, lowercase, number, and special character)

**Note:** Either `token` or `email` must be provided, depending on the flow.

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
  "message": "Password set successfully"
}
```

**Notes:**
- Accepts `{ token, password }` or `{ email, password }` depending on flow

