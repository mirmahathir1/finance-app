[← Back to Forgot Password](../forgot-password.md#api-forgot-password-request)

# POST /api/auth/forgot-password/request

**Endpoint:** `POST /api/auth/forgot-password/request`  
**Rate limit:** 5 per email/hour, 10 per IP/hour  
**Description:** Request password reset link; send Brevo email with reset link (always returns 200)

## Request Body

```json
{
  "email": "user@example.com"
}
```

**Fields:**
- `email` (string, required) - User's email address

## Success Response (200 OK)

```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent"
}
```

**Notes:**
- Generic message prevents email enumeration
- Always returns 200 to avoid user enumeration
- Accepts `{ email }`, creates short-lived signed token, emails reset link

