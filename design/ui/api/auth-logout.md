[← Back to Sign In](../signin.md#api-session-management)

# POST /api/auth/logout

**Endpoint:** `POST /api/auth/logout`  
**Rate limit:** 20 per IP/minute  
**Description:** Logout and invalidate session

## Request

No request body required. The endpoint uses the authenticated user's session cookie to identify which session to invalidate.

## Success Response (200 OK)

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Notes:**
- Invalidates current session, clears cookie
- **Frontend behavior**: All frontend-side data will be reset on logout, including:
  - Local state (transactions, statistics, user preferences)
  - Cached data
  - Local storage entries
  - Session storage entries
  - Any client-side application state

