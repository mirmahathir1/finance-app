[← Back to Sign In](../signin.md#api-session-management)

# GET /api/auth/session

**Endpoint:** `GET /api/auth/session`  
**Rate limit:** 60 per IP/minute  
**Description:** Get current session/user

## Request

No parameters or request body required. The endpoint uses the authenticated user's session cookie to identify the current session.

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
- Returns authenticated user context

