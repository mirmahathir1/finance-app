# Authentication & Security

## Authentication Flow

### OAuth 2.0 with Google
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth consent screen
3. User grants permissions
4. Google redirects back with authorization code
5. Exchange code for access token and refresh token
6. Store tokens securely (HTTP-only cookies)
7. Create user session

### Session Management
- Use NextAuth.js for session handling
- JWT tokens for stateless sessions
- Refresh token rotation for security
- Session expiry: 30 days (configurable)

## Security Considerations

### Data Privacy
- All data stored in user's personal Google Drive
- No data stored on application servers
- Each user accesses only their own files

### API Security
- CSRF protection with NextAuth.js
- Rate limiting on API routes
- Input validation and sanitization
- SQL injection prevention (N/A - using CSV)

### OAuth Security
- Use PKCE flow for additional security
- Validate redirect URIs
- Store tokens securely (HTTP-only cookies)
- Implement token refresh logic

## Error Handling

### Client-Side Errors
- Form validation errors: Display inline below fields
- Network errors: Show snackbar with retry option
- Authentication errors: Redirect to sign-in

### Server-Side Errors
- 401 Unauthorized: Refresh token or re-authenticate
- 403 Forbidden: Show permission error
- 404 Not Found: Show empty state
- 500 Server Error: Show error page with support info

### Logging
- Client: Console errors in development
- Server: Structured logging with timestamps
- Production: Error tracking service (optional)

## Google Cloud Configuration & Scopes

### Required Google Cloud Project Configuration
1. OAuth 2.0 Client ID
   - Create credentials in Google Cloud Console
   - Add authorized JavaScript origins
   - Add authorized redirect URIs
2. Enable APIs
   - Google Drive API
   - Google People API (for user profile)

### OAuth Scopes
- https://www.googleapis.com/auth/userinfo.profile
- https://www.googleapis.com/auth/userinfo.email
- https://www.googleapis.com/auth/drive.file
- https://www.googleapis.com/auth/drive.appdata

### Environment Variables
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=your_app_url
```
