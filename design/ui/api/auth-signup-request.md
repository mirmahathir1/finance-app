[← Back to Sign Up](../signup.md#api-signup-request)

# POST /api/auth/signup/request

**Endpoint:** `POST /api/auth/signup/request`  
**Rate limit:** 5 per email/hour, 10 per IP/hour  
**Description:** Initiate signup by email; send Brevo verification link (always returns 200)

## Request Body

```json
{
  "email": "user@example.com"
}
```

**Fields:**
- `email` (string, required) - Email address for account creation

## Success Response (200 OK)

```json
{
  "success": true,
  "message": "If an account with that email exists, a verification link has been sent"
}
```

**Notes:**
- Generic message prevents email enumeration
- Always returns 200 to avoid user enumeration
- Accepts `{ email }`, creates short-lived signed token, emails verification link

