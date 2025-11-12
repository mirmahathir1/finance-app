[← Back to README](README.md)

# Deployment & Distribution

## Deployment Architecture

### Docker Container
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Google Cloud Run
- Automatic HTTPS
- Auto-scaling based on traffic
- Pay-per-use pricing
- Global CDN

### Environment Variables
- Inject via Cloud Run service configuration
- Use Secret Manager for sensitive data
- Never commit credentials to repository

## Progressive Web App (PWA)

### Manifest Configuration
```json
{
  "name": "Finance Tracker",
  "short_name": "FinApp",
  "description": "Personal finance tracking app",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1976d2",
  "background_color": "#fafafa",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker
- Cache static assets
- Offline fallback page
- Background sync for pending operations (optional)

## Bubblewrap / Android App

### Configuration
1. Generate TWA (Trusted Web Activity)
2. Configure Digital Asset Links
3. Set app name, icons, colors
4. Build APK/AAB for Google Play

### Requirements
- Valid domain with HTTPS
- PWA manifest
- Service worker
- Lighthouse PWA score > 90

## Environment Variables

### Authentication & Database
```
DATABASE_URL=postgres://user:password@host:port/dbname?sslmode=require  # Neon connection string
SESSION_COOKIE_NAME=app_session
JWT_SECRET=your_jwt_secret_if_applicable
```

### Signup Email Verification
```
SIGNUP_JWT_SECRET=your_signup_jwt_secret
SIGNUP_JWT_TTL_MINUTES=15
APP_BASE_URL=https://your.app
VERIFY_ROUTE_PATH=/verify
```

### Password Reset
```
RESET_PASSWORD_JWT_SECRET=your_reset_password_jwt_secret
RESET_PASSWORD_JWT_TTL_MINUTES=15
RESET_PASSWORD_ROUTE_PATH=/reset-password
```

### Brevo (Sendinblue) Email Service
```
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=no-reply@your.app
BREVO_SENDER_NAME=Your App
```

### Environment Variable Management
- Inject via Cloud Run service configuration
- Use Secret Manager for sensitive data
- Never commit credentials to repository

