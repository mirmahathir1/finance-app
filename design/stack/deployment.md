[← Back to README](README.md)

# Deployment & Distribution

## Deployment Summary

**Production Deployment Stack:**
- **Application**: Next.js 14+ deployed to **Google Cloud Run** (serverless container platform)
- **Database**: **Neon PostgreSQL** (serverless, external database)
- **Email Service**: **Brevo** (Sendinblue) for transactional emails
- **Container**: Docker (multi-stage build with Node.js 20)

**Why This Stack:**
- **Cloud Run**: Free tier includes 2M requests/month, auto-scaling, pay-per-use
- **Neon**: Free tier with 0.5 GB storage, automatic scaling, connection pooling
- **Brevo**: Free tier with 300 emails/day, reliable transactional email delivery

All services operate within their respective free tiers, making this a cost-effective solution for small to medium applications.

## Deployment Architecture

### Next.js Application on Google Cloud Run

The Next.js application is deployed as a Docker container to **Google Cloud Run**, a serverless platform that automatically scales based on traffic.

**Key Features:**
- Automatic HTTPS
- Auto-scaling based on traffic (scales to zero when idle)
- Pay-per-use pricing (generous free tier)
- Global CDN
- Container-based deployment

### Docker Container

The application uses a multi-stage Docker build (see `Dockerfile` in project root):

```dockerfile
# Production Dockerfile uses node:20-alpine
# Multi-stage build for optimized image size
# Generates Prisma Client and builds Next.js standalone output
```

**Note:** The actual Dockerfile uses `node:20-alpine` and includes Prisma Client generation. See `Dockerfile` in the project root for the complete configuration.

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

**Database: Neon PostgreSQL**

The application uses **Neon** (serverless PostgreSQL) as the primary database. Neon provides:
- Free tier with 0.5 GB storage
- Automatic scaling
- Connection pooling
- Database branching for development

**Connection String:**
```
DATABASE_URL=postgres://user:password@host:port/dbname?sslmode=require  # Neon connection string
SESSION_COOKIE_NAME=app_session
JWT_SECRET=your_jwt_secret_if_applicable
```

**Note:** Cloud Run connects to Neon via the public internet using SSL. No Cloud SQL or VPC configuration needed.

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

**Email Provider: Brevo**

The application uses **Brevo** (formerly Sendinblue) for transactional emails:
- Email verification during signup
- Password reset emails
- Free tier available (300 emails/day)

**Required Environment Variables:**
```
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=no-reply@your.app
BREVO_SENDER_NAME=Your App
```

**Note:** In development, MailHog can be used for local email testing, but production deployments on Cloud Run must use Brevo.

### Environment Variable Management
- Inject via Cloud Run service configuration
- Use Secret Manager for sensitive data
- Never commit credentials to repository

