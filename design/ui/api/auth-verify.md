[← Back to Verify](../verify.md#api-email-verification)

# GET /api/auth/verify

**Endpoint:** `GET /api/auth/verify?token=`  
**Rate limit:** 10 per IP/hour  
**Description:** Verify signup token; create user and mark email as verified

## Query Parameters

- `token` (string, required) - Verification token from email link

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
    },
    "sessionCreated": true
  },
  "message": "Email verified successfully"
}
```

**Notes:**
- Session cookie is set automatically in HTTP-only cookie
- On success, create user if not exists, set `email_verified_at`, and continue session/onboarding

